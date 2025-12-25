
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasksForMember, updateMemberTask, deleteTask, getAllMemberTasks } from "../services/tasks.service";
import type { MemberTask } from "../types";

export const TASK_KEYS = {
    all: ['tasks'] as const,
    member: (memberId: string) => [...TASK_KEYS.all, 'member', memberId] as const,
    team: (teamId: string) => [...TASK_KEYS.all, 'team', teamId] as const,
    details: () => [...TASK_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...TASK_KEYS.details(), id] as const,
    allAssignments: () => [...TASK_KEYS.all, 'assignments'] as const,
};

export function useMemberTasks(memberId: string) {
    return useQuery({
        queryKey: TASK_KEYS.member(memberId),
        queryFn: () => getTasksForMember(memberId),
        enabled: !!memberId,
    });
}

export function useAllMemberTasks() {
    return useQuery({
        queryKey: TASK_KEYS.allAssignments(),
        queryFn: getAllMemberTasks,
    });
}

export function useUpdateMemberTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<MemberTask> }) => 
            updateMemberTask(id, updates),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: TASK_KEYS.member(data.member_id) });
                queryClient.invalidateQueries({ queryKey: TASK_KEYS.team(data.team_id || '') });
            }
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
        },
    });
}
