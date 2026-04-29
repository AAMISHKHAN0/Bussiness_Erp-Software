import React, { useState, useEffect } from 'react';
import {
    File, Image as ImageIcon, FileText, Upload, Trash2,
    Download, Search, Filter, MoreVertical, Loader2,
    HardDrive, CheckCircle, XCircle, Grid, List as ListIcon
} from 'lucide-react';
import api, { RESOURCES_URL } from '../services/api';

const MediaManager = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await api.get('/files');
            setFiles(response.data.data);
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFiles(prev => [response.data.data, ...prev]);
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            await api.delete(`/files/${id}`);
            setFiles(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete file');
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type) => {
        if (type.includes('image')) return <ImageIcon className="text-blue-500" size={24} />;
        if (type.includes('pdf')) return <FileText className="text-red-500" size={24} />;
        return <File className="text-gray-500" size={24} />;
    };

    const filteredFiles = files.filter(f =>
        (f.name || f.originalName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Media & Document Manager</h1>
                    <p className="text-gray-500">Manage invoices, employee documents, and system assets.</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className={`btn-primary flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {uploading ? 'Uploading...' : 'Upload File'}
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Storage Overview */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-6">
                <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
                    <HardDrive size={24} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                        <span className="text-sm text-gray-500">2.4 GB of 10 GB (24%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-lg border border-gray-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-2 focus:ring-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-md">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <File className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No files found</h3>
                    <p className="text-gray-500">Upload documents to see them here.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredFiles.map((file, i) => (
                        <div key={i} className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-primary-300 transition-all hover:shadow-md">
                            <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                                {file.type?.includes('image') || file.mimetype?.includes('image') ? (
                                    <img
                                        src={file.url?.startsWith('http') ? file.url : `${RESOURCES_URL}${file.url}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.src = 'https://placehold.co/150?text=Preview'}
                                    />
                                ) : (
                                    getFileIcon(file.type || file.mimetype)
                                )}
                                <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(file.id)} className="p-1.5 bg-white/90 backdrop-blur border border-gray-100 rounded-md shadow-sm text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-semibold text-gray-900 truncate mb-1" title={file.name || file.originalName}>
                                    {file.name || file.originalName}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">
                                    {formatSize(file.size)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">File Name</th>
                                    <th className="px-6 py-3">Size</th>
                                    <th className="px-6 py-3">Uploaded</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredFiles.map((file, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(file.type || file.mimetype)}
                                                <span className="text-sm font-medium text-gray-900">{file.name || file.originalName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{formatSize(file.size)}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{file.uploadedAt || 'Just now'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md">
                                                    <Download size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(file.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaManager;
