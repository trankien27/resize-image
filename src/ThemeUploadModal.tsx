import { useState } from "react";
import * as React from "react";

interface ThemeCategory {
    id: number;
    name: string;
    orderNo: number;
    isActive: boolean;
}

interface ThemeList {
    id: number;
    name: string;
    orderNo: number;
    isActive: boolean;
}

interface ThemeUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: any) => void;
    unmappedImageName?: string;
    themeCategories: ThemeCategory[];
    themeLists: ThemeList[];
}

const ThemeUploadModal = ({ isOpen, onClose, onUpload, unmappedImageName, themeCategories, themeLists }: ThemeUploadModalProps) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#f16d94");
    const [categoryId, setCategoryId] = useState("");
    const [selectedThemeLists, setSelectedThemeLists] = useState<number[]>([]);
    const [layoutListId, setLayoutListId] = useState("61");
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [isLiveView, setIsLiveView] = useState(true);

    // Profile management
    const [profiles, setProfiles] = useState<Record<string, any>>({});
    const [currentProfileName, setCurrentProfileName] = useState("");
    const [newProfileName, setNewProfileName] = useState("");

    // Load all saved profiles from localStorage on mount
    React.useEffect(() => {
        const savedProfiles = localStorage.getItem('themeUploadProfiles');
        if (savedProfiles) {
            try {
                const parsedProfiles = JSON.parse(savedProfiles);
                setProfiles(parsedProfiles);
            } catch (e) {
                console.error('Failed to load profiles:', e);
            }
        }
    }, []);

    if (!isOpen) return null;

    const saveProfile = () => {
        if (!newProfileName.trim()) {
            alert('Vui lòng nhập tên profile');
            return;
        }

        const profile = {
            categoryId,
            selectedThemeLists,
            layoutListId,
            color
        };

        const updatedProfiles = { ...profiles, [newProfileName]: profile };
        setProfiles(updatedProfiles);
        localStorage.setItem('themeUploadProfiles', JSON.stringify(updatedProfiles));
        setCurrentProfileName(newProfileName);
        setNewProfileName("");
        alert(`Đã lưu profile "${newProfileName}"!`);
    };

    const loadProfile = (profileName: string) => {
        setSelectedThemeLists(profiles[profileName].selectedThemeLists);
        if (!profileName || !profiles[profileName]) {
            alert('Profile không tồn tại');
            return;
        }

        const profile = profiles[profileName];
        if (profile.categoryId) setCategoryId(profile.categoryId);
        if (profile.selectedThemeLists) setSelectedThemeLists(profile.selectedThemeLists);
        if (profile.layoutListId) setLayoutListId(profile.layoutListId);
        if (profile.color) setColor(profile.color);
        setCurrentProfileName(profileName);
        alert(`Đã tải profile "${profileName}"!`);
    };

    const deleteProfile = (profileName: string) => {
        if (!profileName || !profiles[profileName]) return;

        if (confirm(`Xóa profile "${profileName}"?`)) {
            const updatedProfiles = { ...profiles };
            delete updatedProfiles[profileName];
            setProfiles(updatedProfiles);
            localStorage.setItem('themeUploadProfiles', JSON.stringify(updatedProfiles));
            if (currentProfileName === profileName) {
                setCurrentProfileName("");
            }
            alert(`Đã xóa profile "${profileName}"!`);
        }
    };

    const handleThemeListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = Number(e.target.value);
        if (selectedId && !selectedThemeLists.includes(selectedId)) {
            setSelectedThemeLists([...selectedThemeLists, selectedId]);
        }
        // Reset select to placeholder
        e.target.value = "";
    };

    const removeThemeList = (idToRemove: number) => {
        setSelectedThemeLists(selectedThemeLists.filter(id => id !== idToRemove));
    };

    const handleSubmit = () => {
        if (!name || (!thumbnail && !unmappedImageName)) {
            alert("Vui lòng nhập tên và chọn ảnh thumbnail (hoặc có sẵn ảnh chưa map)");
            return;
        }
        if (!categoryId) {
            alert("Vui lòng chọn danh mục");
            return;
        }
        onUpload({
            name,
            color,
            themeCategoryId: categoryId,
            themeListIds: selectedThemeLists.join(','),
            layoutListId,
            thumbnail,
            isDisplayOnLiveview: isLiveView,
        });

    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Upload Theme</h2>

                {/* Profile Management */}
                <div className="profile-actions">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <select
                            value={currentProfileName}
                            onChange={(e) => loadProfile(e.target.value)}
                            style={{ flex: 1 }}
                        >
                            <option value="">-- Chọn Profile --</option>
                            {Object.keys(profiles).map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        {currentProfileName && (
                            <button
                                onClick={() => deleteProfile(currentProfileName)}
                                className="btn-profile btn-clear-profile"
                                type="button"
                                style={{ padding: '6px 10px' }}
                            >
                                �️
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="Tên profile mới..."
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                        <button onClick={saveProfile} className="btn-profile btn-save-profile" type="button">
                            � Lưu mới
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Tên Theme:</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Màu sắc:</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                        <input type="text" value={color} onChange={(e) => setColor(e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Danh mục:</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">-- Chọn danh mục --</option>
                        {themeCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Theme Lists:</label>
                    {selectedThemeLists.length > 0 && (
                        <div className="tag-container">
                            {selectedThemeLists.map(id => {
                                const list = themeLists.find(l => l.id === id);
                                return list ? (
                                    <div key={id} className="tag">
                                        <span>{list.name}</span>
                                        <button type="button" onClick={() => removeThemeList(id)} className="tag-remove">×</button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    )}
                    <select onChange={handleThemeListChange} value="">
                        <option value="">-- Chọn để thêm --</option>
                        {themeLists.filter(list => !selectedThemeLists.includes(list.id)).map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Layout List ID:</label>
                    <input type="text" value={layoutListId} onChange={(e) => setLayoutListId(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Thumbnail:</label>
                    {unmappedImageName && !thumbnail ? (
                        <div style={{ marginBottom: 10, fontSize: '0.9em', color: '#6366f1' }}>
                            ℹ️ Sử dụng ảnh chưa map: <b>{unmappedImageName}</b>
                        </div>
                    ) : null}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                    />
                </div>
                <div className="form-group" style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <input
                        type="checkbox"
                        checked={isLiveView}
                        onChange={(e) => setIsLiveView(e.target.checked)}
                        id="liveview"
                    />
                    <label htmlFor="liveview" style={{ marginBottom: 0 }}>Hiển thị trên Liveview</label>
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-cancel">Hủy</button>
                    <button onClick={handleSubmit} className="btn-save">Upload</button>
                </div>
            </div>
        </div>
    );
};

export default ThemeUploadModal;
