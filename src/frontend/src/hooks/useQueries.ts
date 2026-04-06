import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useActor } from "./useActor";

export function useAttendanceBoard() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["attendanceBoard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceBoard();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAnnouncements();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
  });
}

export function useNotifications(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notifications", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getNotifications(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 30_000,
  });
}

export function useAllUsers(userId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUsers", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getAllUsers(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useAllPasswords(userId: bigint | null, enabled: boolean) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allPasswords", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getAllPasswords(userId);
    },
    enabled: !!actor && !isFetching && !!userId && enabled,
  });
}

export function useDemotionCandidates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["demotionCandidates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDemotionCandidates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.checkIn(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceBoard"] });
    },
  });
}

export function useCheckOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.checkOut(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceBoard"] });
    },
  });
}

export function useSendAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      message,
    }: { userId: bigint; message: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.sendAnnouncement(userId, message);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useDemoteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      initiatorId,
      targetId,
    }: { initiatorId: bigint; targetId: bigint }) => {
      if (!actor) throw new Error("No actor");
      const result = await actor.demoteUser(initiatorId, targetId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceBoard"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["demotionCandidates"] });
    },
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notifId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markNotificationRead(notifId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId?.toString()],
      });
    },
  });
}

export function useRunInactivityCheck() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.runInactivityCheck();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceBoard"] });
      queryClient.invalidateQueries({ queryKey: ["demotionCandidates"] });
    },
  });
}

export function useChangePassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      userId,
      currentPassword,
      newPassword,
    }: { userId: bigint; currentPassword: string; newPassword: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await (actor as any).changePassword(
        userId,
        currentPassword,
        newPassword,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
  });
}

export function useAdminChangePassword() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requesterId,
      targetUserId,
      newPassword,
    }: { requesterId: bigint; targetUserId: bigint; newPassword: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await (actor as any).adminChangePassword(
        requesterId,
        targetUserId,
        newPassword,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPasswords"] });
    },
  });
}

export function useChangeUsername() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      userId,
      currentPassword,
      newUsername,
    }: { userId: bigint; currentPassword: string; newUsername: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await (actor as any).changeUsername(
        userId,
        currentPassword,
        newUsername,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
  });
}

export function useAdminChangeUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requesterId,
      targetUserId,
      newUsername,
    }: { requesterId: bigint; targetUserId: bigint; newUsername: string }) => {
      if (!actor) throw new Error("No actor");
      const result = await (actor as any).adminChangeUsername(
        requesterId,
        targetUserId,
        newUsername,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceBoard"] });
    },
  });
}
