import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Announcement {
    id: bigint;
    authorUsername: string;
    message: string;
    timestamp: bigint;
}
export interface UserProfile {
    id: bigint;
    inactivityWarnings: bigint;
    username: string;
    password: string;
    role: UserRole;
    isOnline: boolean;
    demotionWarning: boolean;
    lastCheckIn: bigint;
}
export interface Notification {
    id: bigint;
    isRead: boolean;
    message: string;
    timestamp: bigint;
}
export enum UserRole {
    admin = "admin",
    seniorAdmin = "seniorAdmin",
    owner = "owner",
    staff = "staff"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    checkIn(userId: bigint): Promise<void>;
    checkOut(userId: bigint): Promise<void>;
    demoteUser(initiatorUserId: bigint, targetUserId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllPasswords(requesterId: bigint): Promise<{
        __kind__: "ok";
        ok: Array<{
            username: string;
            password: string;
            role: string;
        }>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllUsers(requesterId: bigint): Promise<{
        __kind__: "ok";
        ok: Array<UserProfile>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAnnouncements(): Promise<Array<Announcement>>;
    getAttendanceBoard(): Promise<Array<{
        username: string;
        userId: bigint;
        role: string;
        isOnline: boolean;
        lastCheckIn: bigint;
        inactivityDays: bigint;
    }>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getCurrentUser(): Promise<UserProfile | null>;
    getDemotionCandidates(): Promise<Array<UserProfile>>;
    getNotifications(userId: bigint): Promise<Array<Notification>>;
    getUserById(userId: bigint): Promise<UserProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: {
            userId: bigint;
            role: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    markNotificationRead(notifId: bigint): Promise<void>;
    runInactivityCheck(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendAnnouncement(userId: bigint, message: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
