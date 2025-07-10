// App.tsx (Đã thêm kéo folder và nút xóa tất cả ảnh)
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useRef, useState, useEffect } from "react";
import './App.css';
import ComingSoonModal from "./ComingSoonModal";


interface ResizedImage {
  name: string;
  src: string;
  width: number;
  height: number;
  isCustom: boolean;
  customWidth: number;
  customHeight: number;
}

const sizeMap: Record<string, [number, number]> = {
  "158A": [1080, 1720], "158B": [1080, 1720], "158C": [1080, 1720],
  "158D": [1720, 1080], "158E": [1720, 1080],
  "264A": [1020, 3040], "264B": [1020, 3040], "264C": [3040, 1020], "264D": [3040, 1020], "264E": [2040, 3040],
  "461A": [2040, 3040], "461B": [3040, 2040], "463A": [2040, 3040], "463B": [3040, 2040],
  "464A": [2040, 3040], "464B": [3040, 2040], "466A": [2040, 3040], "466B": [3040, 2040],
  "468A": [2040, 3040], "468B": [3040, 2040],
  "620A": [3060, 10200], "620B": [10200, 3060], "620C": [10200, 3060],
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [images, setImages] = useState<ResizedImage[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  const handleShowComingSoon = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
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
      } else if (/image\/(png|jpeg|jpg|webp)/.test(file.type)) {
        handleImageFile(file);
      } else if (ext === "rar") {
        alert("Không hỗ trợ file .rar. Vui lòng dùng .zip.");
      }
    });
  };

  const handleImageFile = (file: File) => {
    const fileName = file.name.split(".")[0];
    const code = Object.keys(sizeMap).find((k) => fileName.toUpperCase().includes(k));
    const [targetW, targetH] = sizeMap[code ?? ""] ?? [null, null];

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
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
          },
        ]);
      };
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = (img: ResizedImage) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
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
    for (const img of images) {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
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

  const updateImage = (index: number, data: Partial<ResizedImage>) => {
    setImages((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], ...data };
      return newList;
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => setImages([]);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <div className="taskbar">
        <div className="taskbar-left">
          <nav className="menu">
            <a href="#" onClick={handleShowComingSoon}>Compress</a>
            <a href="#" className="active">Resize</a>
            <a href="#" onClick={handleShowComingSoon}>Crop</a>
            <a href="#" onClick={handleShowComingSoon}>Convert</a>
            <a href="#" onClick={handleShowComingSoon}>More</a>
          </nav>
        </div>
        <div className="taskbar-right">
          <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? "🌞 Light" : "🌙 Dark"}</button>
          <button className="login-btn" onClick={handleShowComingSoon}>Đăng nhập</button>
        </div>
      </div>

      <div className="container">
        <div className="dropzone"
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("fileInput")?.click()}>
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
                <button onClick={downloadAll} className="download-all">📦 Tải tất cả (.zip)</button>
                <button onClick={clearAll} className="btn-remove" style={{ marginLeft: 10 }}>🗑️ Xóa tất cả</button>
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
                    <p className="image-size">{img.width} × {img.height}</p>
                  )}

                  <div className="image-actions">
                    <button onClick={() => downloadImage(img)} className="btn-green">⬇️ Tải</button>
                    <button onClick={() => removeImage(i)} className="btn-red">❌ Xóa</button>
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
    </div>
  );
}

export default App;
