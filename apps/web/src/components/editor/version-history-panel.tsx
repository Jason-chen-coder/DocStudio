'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { documentService } from '@/services/document-service';
import { DocumentSnapshot } from '@/types/document';
import { History, User, RotateCcw, X, Plus, Check } from 'lucide-react';
import Image from 'next/image';
import { getCdnUrl } from '@/lib/cdn';
import { VersionPreviewDialog } from './version-preview-dialog';

interface VersionHistoryPanelProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
    onRestore: () => void;
}

export function VersionHistoryPanel({ documentId, isOpen, onClose, onRestore }: VersionHistoryPanelProps) {
    const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewSnapshot, setPreviewSnapshot] = useState<DocumentSnapshot | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Manual save state
    const [savingManual, setSavingManual] = useState(false);
    const [showMessageInput, setShowMessageInput] = useState(false);
    const [manualMessage, setManualMessage] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const loadSnapshots = useCallback(async () => {
        try {
            setLoading(true);
            const data = await documentService.getSnapshots(documentId);
            setSnapshots(data);
        } catch (error) {
            console.error('Failed to load snapshots:', error);
        } finally {
            setLoading(false);
        }
    }, [documentId]);

    useEffect(() => {
        if (isOpen && documentId) {
            loadSnapshots();
        } else {
            setPreviewSnapshot(null); // Reset preview when closed
            setShowMessageInput(false);
            setManualMessage('');
            setSaveSuccess(false);
        }
    }, [isOpen, documentId, loadSnapshots]);

    async function handleManualSave() {
        try {
            setSavingManual(true);
            await documentService.createSnapshot(documentId, manualMessage.trim() || undefined);
            setSaveSuccess(true);
            setShowMessageInput(false);
            setManualMessage('');
            await loadSnapshots();
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Failed to create snapshot:', error);
            alert('保存版本失败，请稍后重试');
        } finally {
            setSavingManual(false);
        }
    }

    async function handlePreview(snapshot: DocumentSnapshot) {
        try {
            setLoadingPreview(true);
            // 获取完整的快照内容（包括 content 字段）
            const fullSnapshot = await documentService.getSnapshot(documentId, snapshot.id);
            setPreviewSnapshot(fullSnapshot);
        } catch (error) {
            console.error('Failed to load snapshot:', error);
            alert('加载历史版本失败，请稍后重试');
        } finally {
            setLoadingPreview(false);
        }
    }

    async function handleRestore(snapshotId: string) {
        if (!confirm('确定要将文档恢复到此历史版本吗？这将会覆盖当前内容。')) {
            return;
        }

        try {
            setRestoring(true);
            await documentService.restoreSnapshot(documentId, snapshotId);
            onRestore(); // Trigger parent refresh or notification
            onClose();   // Close the panel
        } catch (error) {
            console.error('Failed to restore snapshot:', error);
            alert('恢复版本失败，请稍后重试');
        } finally {
            setRestoring(false);
        }
    }

    if (!isOpen) return null;

    return (
        <>
            {/* Background Overlay */}
            <div
                className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Side Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">版本历史</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Manual Save Button */}
                        <button
                            onClick={() => {
                                if (showMessageInput) {
                                    setShowMessageInput(false);
                                    setManualMessage('');
                                } else {
                                    setShowMessageInput(true);
                                }
                            }}
                            disabled={savingManual}
                            title="保存当前版本"
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                                saveSuccess
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                            }`}
                        >
                            {saveSuccess ? (
                                <><Check className="w-3.5 h-3.5" /> 已保存</>
                            ) : (
                                <><Plus className="w-3.5 h-3.5" /> 保存版本</>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Manual Save Input Area */}
                {showMessageInput && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">为此版本添加备注（可选）</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualMessage}
                                onChange={(e) => setManualMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') void handleManualSave();
                                    if (e.key === 'Escape') { setShowMessageInput(false); setManualMessage(''); }
                                }}
                                placeholder="例如：完成第一章初稿"
                                autoFocus
                                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={() => void handleManualSave()}
                                disabled={savingManual}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                                {savingManual ? '保存中...' : '确认保存'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            加载历史记录中...
                        </div>
                    ) : snapshots.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center text-gray-500">
                            <History className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                            <p>暂无历史版本记录</p>
                            <p className="text-sm mt-1 text-gray-400">文档修改后系统会自动创建快照</p>
                        </div>
                    ) : (
                        <div className="relative pl-3">
                            {/* Timeline Line */}
                            <div className="absolute top-4 bottom-4 left-[15px] w-px bg-gray-200 dark:bg-gray-700" />

                            <ul className="space-y-6">
                                {snapshots.map((snapshot, index) => {
                                    const creatorAvatar = snapshot.creator?.avatarUrl ? getCdnUrl(snapshot.creator.avatarUrl) : null;
                                    const isLatest = index === 0;
                                    const isManual = !!snapshot.message && snapshot.message !== '自动保存' && snapshot.message !== '恢复前自动备份';

                                    return (
                                        <li key={snapshot.id} className="relative pl-8">
                                            {/* Timeline Dot */}
                                            <div className={`absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full border-2 border-white dark:border-gray-800 ${
                                                isLatest ? 'bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                                                : isManual ? 'bg-green-500 ring-2 ring-green-200 dark:ring-green-900'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                            }`} />

                                            <div className={`bg-white dark:bg-gray-800 border ${
                                                isLatest ? 'border-blue-200 dark:border-blue-800 shadow-sm'
                                                : isManual ? 'border-green-200 dark:border-green-800'
                                                : 'border-gray-200 dark:border-gray-700'
                                            } rounded-xl p-4 transition-all hover:border-blue-300 dark:hover:border-blue-700`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                        {format(new Date(snapshot.createdAt), 'MM月dd日 HH:mm', { locale: zhCN })}
                                                        {isLatest && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded leading-none ml-1">当前</span>}
                                                        {isManual && !isLatest && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded leading-none ml-1">手动</span>}
                                                    </span>
                                                </div>

                                                {snapshot.message && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        {snapshot.message}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        {creatorAvatar ? (
                                                            <Image src={creatorAvatar} alt="" width={16} height={16} className="rounded-full w-4 h-4 object-cover" unoptimized />
                                                        ) : (
                                                            <User className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>{snapshot.creator?.name || '未知用户'}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handlePreview(snapshot)}
                                                            disabled={loadingPreview}
                                                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer disabled:opacity-50"
                                                        >
                                                            {loadingPreview ? '加载中...' : '预览'}
                                                        </button>
                                                        {!isLatest && (
                                                            <>
                                                                <span className="text-gray-300">|</span>
                                                                <button
                                                                    onClick={() => handleRestore(snapshot.id)}
                                                                    disabled={restoring}
                                                                    className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" /> 回滚
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <VersionPreviewDialog
                snapshot={previewSnapshot}
                isOpen={!!previewSnapshot}
                onClose={() => setPreviewSnapshot(null)}
                onRestore={handleRestore}
                restoring={restoring}
            />
        </>
    );
}
