
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMembers, getAllPointsHistory, getMemberById, getPointsHistory, updateMember, addComplaint, getMemberRank, deleteMember, createPoste, updatePoste, deletePoste } from "../services/members.service";
import type { Member } from "../types";

export const MEMBER_KEYS = {
    all: ['members'] as const,
    lists: () => [...MEMBER_KEYS.all, 'list'] as const,
    details: () => [...MEMBER_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...MEMBER_KEYS.details(), id] as const,
    history: (id: string) => [...MEMBER_KEYS.detail(id), 'history'] as const,
    allHistory: () => [...MEMBER_KEYS.all, 'all-history'] as const,
};

export function useMembers() {
    return useQuery({
        queryKey: MEMBER_KEYS.lists(),
        queryFn: getMembers,
    });
}

export function useAllPointsHistory() {
    return useQuery({
        queryKey: MEMBER_KEYS.allHistory(),
        queryFn: getAllPointsHistory,
    });
}

export function useMember(id?: string) {
    return useQuery({
        queryKey: MEMBER_KEYS.detail(id || ''),
        queryFn: async () => {
            const member = await getMemberById(id!);
            if (!member) return null;
            const rank = await getMemberRank(member.points);
            return { ...member, rankPos: rank };
        },
        enabled: !!id,
    });
}

export function useMemberHistory(id?: string) {
    return useQuery({
        queryKey: MEMBER_KEYS.history(id || ''),
        queryFn: () => getPointsHistory(id!),
        enabled: !!id,
    });
}

export function useUpdateMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Member> }) => updateMember(id, updates),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists() });
        },
    });
}

export function useAddComplaint() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ memberId, content }: { memberId: string, content: string }) => addComplaint(memberId, content),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.detail(variables.memberId) });
        },
    });
}

export function useDeleteMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMember(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.lists() });
        },
    });
}

export function useCreatePoste() {
    return useMutation({
        mutationFn: ({ name, roleId }: { name: string, roleId: string }) => createPoste(name, roleId),
    });
}

export function useUpdatePoste() {
    return useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => updatePoste(id, name),
    });
}

export function useDeletePoste() {
    return useMutation({
        mutationFn: (id: string) => deletePoste(id),
    });
}
