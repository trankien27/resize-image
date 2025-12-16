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

    // Search states
    const [categorySearch, setCategorySearch] = useState("");
    const [themeListSearch, setThemeListSearch] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showThemeListDropdown, setShowThemeListDropdown] = useState(false);

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

    // const handleThemeListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //     const selectedId = Number(e.target.value);
    //     if (selectedId && !selectedThemeLists.includes(selectedId)) {
    //         setSelectedThemeLists([...selectedThemeLists, selectedId]);
    //     }
    //     // Reset select to placeholder
    //     e.target.value = "";
    // };

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
        setName("")
        setColor("#f16d94")
        setCategoryId(" ")
        setSelectedThemeLists([])
        setLayoutListId("")
        setThumbnail(null)
        setIsLiveView(true)
    };

    // Filtered lists
    const filteredCategories = themeCategories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const filteredThemeLists = themeLists
        .filter(list => !selectedThemeLists.includes(list.id))
        .filter(list => list.name.toLowerCase().includes(themeListSearch.toLowerCase()));

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="modal-content" style={{
                background: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '18px',
                    fontWeight: '600'
                }}>
                    Upload Theme
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Profile Management */}
                    <div className="profile-actions" style={{
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <select
                                value={currentProfileName}
                                onChange={(e) => loadProfile(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
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
                                    style={{
                                        padding: '8px 12px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Tên profile mới..."
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                            <button
                                onClick={saveProfile}
                                className="btn-profile btn-save-profile"
                                type="button"
                                style={{
                                    padding: '8px 16px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                💾 Lưu mới
                            </button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Tên Theme */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Tên Theme:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* Màu sắc */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Màu sắc:</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    style={{ width: '50px', height: '38px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Danh mục */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Danh mục:</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Tìm kiếm và chọn danh mục..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    onFocus={() => setShowCategoryDropdown(true)}
                                    onBlur={() => {
                                        setTimeout(() => setShowCategoryDropdown(false), 200);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: showCategoryDropdown ? '6px 6px 0 0' : '6px',
                                        fontSize: '14px'
                                    }}
                                />
                                {showCategoryDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        background: 'white',
                                        border: '1px solid #d1d5db',
                                        borderTop: 'none',
                                        borderRadius: '0 0 6px 6px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        zIndex: 10
                                    }}>
                                        {filteredCategories.length === 0 ? (
                                            <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '14px' }}>
                                                Không tìm thấy danh mục
                                            </div>
                                        ) : (
                                            filteredCategories.map(cat => (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setCategoryId(String(cat.id));
                                                        setCategorySearch(cat.name);
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        background: categoryId === String(cat.id) ? '#eff6ff' : 'white',
                                                        borderBottom: '1px solid #f3f4f6'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = categoryId === String(cat.id) ? '#eff6ff' : 'white'}
                                                >
                                                    {cat.name}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Theme Lists */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'start' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', paddingTop: '8px' }}>Theme Lists:</label>
                            <div>
                                {selectedThemeLists.length > 0 && (
                                    <div className="tag-container" style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px',
                                        marginBottom: '8px'
                                    }}>
                                        {selectedThemeLists.map(id => {
                                            const list = themeLists.find(l => l.id === id);
                                            return list ? (
                                                <div key={id} className="tag" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    background: '#e0e7ff',
                                                    borderRadius: '4px',
                                                    fontSize: '13px'
                                                }}>
                                                    <span>{list.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeThemeList(id)}
                                                        className="tag-remove"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '16px',
                                                            color: '#4f46e5',
                                                            padding: 0,
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Tìm kiếm và chọn theme list..."
                                        value={themeListSearch}
                                        onChange={(e) => setThemeListSearch(e.target.value)}
                                        onFocus={() => setShowThemeListDropdown(true)}
                                        onBlur={() => {
                                            setTimeout(() => setShowThemeListDropdown(false), 200);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: showThemeListDropdown ? '6px 6px 0 0' : '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    {showThemeListDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderTop: 'none',
                                            borderRadius: '0 0 6px 6px',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                            zIndex: 10
                                        }}>
                                            {filteredThemeLists.length === 0 ? (
                                                <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '14px' }}>
                                                    Không tìm thấy theme list
                                                </div>
                                            ) : (
                                                filteredThemeLists.map(list => (
                                                    <div
                                                        key={list.id}
                                                        onClick={() => {
                                                            if (!selectedThemeLists.includes(list.id)) {
                                                                setSelectedThemeLists([...selectedThemeLists, list.id]);
                                                                setThemeListSearch("");
                                                            }
                                                            setShowThemeListDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '8px 12px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            background: 'white',
                                                            borderBottom: '1px solid #f3f4f6'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                    >
                                                        {list.name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Layout List ID */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Layout List ID:</label>
                            <input
                                type="text"
                                value={layoutListId}
                                onChange={(e) => setLayoutListId(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* Thumbnail */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'start' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', paddingTop: '8px' }}>Thumbnail:</label>
                            <div>
                                {unmappedImageName && !thumbnail ? (
                                    <div style={{
                                        padding: '8px 12px',
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        marginBottom: '8px',
                                        color: '#1e40af'
                                    }}>
                                        ℹ️ Sử dụng ảnh chưa map: <strong>{unmappedImageName}</strong>
                                    </div>
                                ) : null}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                                    style={{ fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        {/* Liveview */}
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Hiển thị:</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={isLiveView}
                                    onChange={(e) => setIsLiveView(e.target.checked)}
                                    id="liveview"
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px' }}>Hiển thị trên Liveview</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-actions" style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        className="btn-cancel"
                        style={{
                            padding: '8px 20px',
                            background: 'white',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn-save"
                        style={{
                            padding: '8px 20px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeUploadModal;