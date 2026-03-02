'use client';

import React from 'react';
import type { CollabUser } from '@/hooks/use-collaboration';

interface OnlineUsersProps {
    users: CollabUser[];
    currentUser?: CollabUser;
    maxVisible?: number;
}

export function OnlineUsers({
    users,
    currentUser,
    maxVisible = 5,
}: OnlineUsersProps) {
    const allUsers = currentUser ? [currentUser, ...users] : users;

    // De-duplicate users by ID so multiple connections from the same user don't duplicate avatars
    const uniqueUsers = Array.from(
        new Map(allUsers.filter(Boolean).map(user => [user.id, user])).values()
    );

    const visible = uniqueUsers.slice(0, maxVisible);
    const overflow = uniqueUsers.length - maxVisible;

    if (uniqueUsers.length === 0) return null;

    return (
        <div className="online-users-stack" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <style jsx>{`
                .online-user-avatar:hover .tooltip-label {
                    opacity: 1 !important;
                }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {visible.map((user, index) => {
                    const isMe = user.id === currentUser?.id;
                    return (
                        <div
                            key={user.id}
                            className="online-user-avatar group"
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                backgroundColor: user.color,
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'white',
                                cursor: 'default',
                                marginLeft: index > 0 ? -8 : 0,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                zIndex: maxVisible - index,
                                position: 'relative',
                                textTransform: 'uppercase',
                                userSelect: 'none',
                                transition: 'transform 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15) translateY(-2px)';
                                (e.currentTarget as HTMLDivElement).style.zIndex = '999';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                                (e.currentTarget as HTMLDivElement).style.zIndex = String(maxVisible - index);
                            }}
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                user.name.charAt(0)
                            )}
                            {/* Custom Tooltip */}
                            <div className="tooltip-label" style={{
                                position: 'absolute',
                                bottom: '-30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#1f2937',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: 'opacity 0.2s ease',
                                zIndex: 1000,
                            }}>
                                {user.name}{isMe ? ' (你)' : ''}
                            </div>
                        </div>
                    );
                })}

                {overflow > 0 && (
                    <div
                        title={`还有 ${overflow} 人在线`}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            backgroundColor: '#6b7280',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'white',
                            cursor: 'default',
                            marginLeft: -8,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            position: 'relative',
                            userSelect: 'none',
                        }}
                    >
                        +{overflow}
                    </div>
                )}
            </div>
        </div>
    );
}
