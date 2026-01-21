import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useRef, useState, useEffect } from "react";
import "./App.css";
import ComingSoonModal from "./ComingSoonModal";
import ThemeUploadModal from "./ThemeUploadModal";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ResizedImage {
  name: string;
  src: string;
  width: number;
  height: number;
  isCustom: boolean;
  customWidth: number;
  customHeight: number;
  layoutId?: number;
}

interface LayoutItem {
  id: number;
  code: string;
  name: string;
  width: number;
  height: number;
}

interface ThemeCategory {
  id: number;
  name: string;
  orderNo: number;
  isActive: boolean;
}

interface ThemeCategoryResponse {
  message: string;
  data: {
    totalItems: number;
    totalPages: number;
    items: ThemeCategory[];
  };
}

interface ThemeList {
  id: number;
  name: string;
  orderNo: number;
  isActive: boolean;
}

interface ThemeListResponse {
  message: string;
  data: {
    totalItems: number;
    totalPages: number;
    items: ThemeList[];
  };
}

interface LayoutResponse {
  message: string;
  data: {
    items: LayoutItem[];
  };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);

  const [images, setImages] = useState<ResizedImage[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [layoutMap, setLayoutMap] = useState<Record<string, LayoutItem>>({});
  const [themeCategories, setThemeCategories] = useState<ThemeCategory[]>([]);
  const [themeLists, setThemeLists] = useState<ThemeList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [layoutResponse, categoryResponse, listResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/LayoutProxy`, { headers: { accept: "*/*" } }),
          fetch(`${API_BASE_URL}/ThemeCategoryProxy`, { headers: { accept: "*/*" } }),
          fetch(`${API_BASE_URL}/ThemeListProxy?pageIndex=0&pageSize=1000`, { headers: { accept: "*/*" } }),
        ]);

        const layoutJson: LayoutResponse = await layoutResponse.json();
        if (layoutJson.message === "Success" && layoutJson.data?.items) {
          const map: Record<string, LayoutItem> = {};
          layoutJson.data.items.forEach((item) => {
            if (item.code) map[item.code] = item;
          });
          setLayoutMap(map);
        }

        const categoryJson: ThemeCategoryResponse = await categoryResponse.json();
        if (categoryJson.message === "Success" && categoryJson.data?.items) {
          setThemeCategories(categoryJson.data.items.filter((cat) => cat.isActive));
        }

        const listJson: ThemeListResponse = await listResponse.json();
        if (listJson.message === "Success" && listJson.data?.items) {
          setThemeLists(listJson.data.items.filter((list) => list.isActive));
        }

        toast.success("Đã tải dữ liệu thành công");
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Không thể tải dữ liệu từ server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleShowComingSoon = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setModalOpen(true);
  };
  const handleCloseModal = () => setModalOpen(false);

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "zip") {
        const zip = new JSZip();
        const loaded = await zip.loadAsync(file);

        loaded.forEach(async (_, entry) => {
          if (!entry.dir && /\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
            const blob = await entry.async("blob");
            const newFile = new File([blob], entry.name, { type: blob.type });
            handleImageFile(newFile);
          }
        });

        return;
      }

      if (/image\/(png|jpeg|jpg|webp)/.test(file.type)) {
        handleImageFile(file);
        return;
      }

      if (ext === "rar") {
        toast.error("Không hỗ trợ file .rar. Vui lòng dùng .zip.");
      }
    });
  };

  const handleImageFile = (file: File) => {
    const fileName = file.name.split(".")[0];
    const code = Object.keys(layoutMap).find((k) => fileName.toUpperCase().includes(k));
    const layoutItem = code ? layoutMap[code] : null;

    const targetW = layoutItem?.width;
    const targetH = layoutItem?.height;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = targetW ?? img.width;
        const h = targetH ?? img.height;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const dataURL = canvas.toDataURL("image/png");

        setImages((prev) => [
          ...prev,
          {
            name: `${code ?? fileName}.png`,
            src: dataURL,
            width: w,
            height: h,
            isCustom: !code,
            customWidth: w,
            customHeight: h,
            layoutId: layoutItem?.id,
          },
        ]);
      };
    };

    reader.readAsDataURL(file);
  };

  const downloadImage = (img: ResizedImage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = img.src;

    image.onload = () => {
      const w = img.isCustom ? img.customWidth : img.width;
      const h = img.isCustom ? img.customHeight : img.height;

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(image, 0, 0, w, h);

      const data = canvas.toDataURL("image/png");
      saveAs(data, img.name);
    };
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    for (const img of images) {
      const image = new Image();
      image.src = img.src;

      await new Promise<void>((res) => {
        image.onload = () => {
          const w = img.isCustom ? img.customWidth : img.width;
          const h = img.isCustom ? img.customHeight : img.height;

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(image, 0, 0, w, h);

          canvas.toBlob((blob) => {
            if (blob) zip.file(img.name, blob);
            res();
          }, "image/png");
        };
      });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "exported-images.zip");
  };

  const handleUploadTheme = async (data: any) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("ThemeCategoryId", data.themeCategoryId);
      formData.append("Name", data.name);
      formData.append("Color", data.color);
      formData.append("IsDisplayOnLiveview", data.isDisplayOnLiveview ? "true" : "false");
      formData.append("OrderNo", "");
      formData.append("ThemeListIds", data.themeListIds);
      formData.append("LayoutListId", data.layoutListId);

      // Determine thumbnail
      let thumbnailBlob: Blob | File | null = data.thumbnail;
      let unmappedImageName = "";
      const unmappedImage = images.find((img) => !img.layoutId);

      if (!thumbnailBlob && unmappedImage) {
        const res = await fetch(unmappedImage.src);
        thumbnailBlob = await res.blob();
        unmappedImageName = unmappedImage.name;
      }

      if (thumbnailBlob) {
        const filename = (data.thumbnail as File)?.name || unmappedImageName || "thumbnail.png";
        formData.append("Thumbnail", thumbnailBlob, filename);
      }

      // Convert base64 images to Blobs (only mapped layouts)
      const imageBlobs: Record<number, Blob> = {};
      for (const img of images) {
        if (img.layoutId) {
          const res = await fetch(img.src);
          imageBlobs[img.layoutId] = await res.blob();
        }
      }

      // Only send layoutThemes for layouts that have images
      let arrayIndex = 0;
      const maxId = Object.values(layoutMap).reduce((max, item) => Math.max(max, item.id), 0) || 40;

      for (let id = 1; id <= maxId; id++) {
        if (imageBlobs[id]) {
          formData.append(`layoutThemes[${arrayIndex}].image`, imageBlobs[id], `layout_${id}.png`);
          formData.append(`layoutThemes[${arrayIndex}].layoutId`, id.toString());
          arrayIndex++;
        }
      }

      const response = await fetch(`${API_BASE_URL}/ThemeProxy/upload-theme`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Upload thành công!");
        setUploadModalOpen(false);
      } else {
        const text = await response.text();
        toast.error(`Upload thất bại! ${text}`);
        console.error("Upload failed", text);
      }
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra khi upload");
    } finally {
      setIsLoading(false);
    }
  };

  const updateImage = (index: number, data: Partial<ResizedImage>) => {
    setImages((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], ...data };
      return newList;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Đã xóa ảnh");
  };

  const clearAll = () => {
    setImages([]);
    toast.info("Đã xóa tất cả ảnh");
  };

  const unmappedImage = images.find((img) => !img.layoutId);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      {/* Toastify container (1 lần duy nhất) */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme={darkMode ? "dark" : "light"}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Đang xử lý...</p>
        </div>
      )}

      <div className="taskbar">
        <div className="taskbar-left">
          <nav className="menu">
            <a href="#" onClick={handleShowComingSoon}>
              Compress
            </a>
            <a href="#" className="active">
              Resize
            </a>
            <a href="#" onClick={handleShowComingSoon}>
              Crop
            </a>
            <a href="#" onClick={handleShowComingSoon}>
              Convert
            </a>
            <a href="#" onClick={handleShowComingSoon}>
              More
            </a>
          </nav>
        </div>
        <div className="taskbar-right">
          <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? "🌞 Light" : "🌙 Dark"}</button>
          <button className="login-btn" onClick={() => setModalOpen(true)}>
            Đăng nhập
          </button>
        </div>
      </div>

      <div className="container">
        <div
          className="dropzone"
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <p>📂 Click hoặc kéo & thả ảnh / file .zip / folder vào đây</p>
          <input
            id="fileInput"
            type="file"
            accept=".zip,image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files!)}
            className="hidden"
            ref={(ref) => {
              if (ref) (ref as HTMLInputElement).webkitdirectory = true;
            }}
          />
        </div>

        {images.length > 0 && (
          <div className="image-panel">
            <div className="panel-header">
              <h2>📋 Danh sách ảnh ({images.length})</h2>
              <div>
                <button onClick={downloadAll} className="download-all">
                  📦 Tải tất cả (.zip)
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="download-all"
                  style={{ marginLeft: 10, backgroundColor: "#E91E63" }}
                >
                  🚀 Upload Theme
                </button>
                <button onClick={clearAll} className="btn-remove" style={{ marginLeft: 10 }}>
                  🗑️ Xóa tất cả
                </button>
              </div>
            </div>

            <div className="image-grid">
              {images.map((img, i) => (
                <div key={i} className="image-box">
                  <div className="image-preview" onClick={() => setPreviewSrc(img.src)}>
                    <img src={img.src} alt={img.name} />
                  </div>

                  <input
                    type="text"
                    value={img.name}
                    onChange={(e) => updateImage(i, { name: e.target.value || "image.png" })}
                    className="filename-input"
                  />

                  {img.isCustom ? (
                    <div className="dimension-inputs">
                      <input
                        type="number"
                        value={img.customWidth}
                        onChange={(e) => updateImage(i, { customWidth: parseInt(e.target.value) || 0 })}
                        placeholder="W"
                      />
                      <input
                        type="number"
                        value={img.customHeight}
                        onChange={(e) => updateImage(i, { customHeight: parseInt(e.target.value) || 0 })}
                        placeholder="H"
                      />
                    </div>
                  ) : (
                    <p className="image-size">
                      {img.width} × {img.height}
                    </p>
                  )}

                  <div className="image-actions">
                    <button onClick={() => downloadImage(img)} className="btn-green">
                      ⬇️ Tải
                    </button>
                    <button onClick={() => removeImage(i)} className="btn-red">
                      ❌ Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {previewSrc && (
          <div className="overlay" onClick={() => setPreviewSrc(null)}>
            <img src={previewSrc} className="preview-large" alt="preview" />
          </div>
        )}
      </div>

      <ComingSoonModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <ThemeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUploadTheme}
        unmappedImageName={unmappedImage?.name}
        themeCategories={themeCategories}
        themeLists={themeLists}
      />
    </div>
  );
}

export default App;
