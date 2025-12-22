import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
    MemberHeader, 
    MemberStatus, 
    MemberPoints,
    MemberPointsProgress,
    MemberObjectives,
    MemberActivities,
    MemberComplaints,
    MemberStrengths,
    MemberWeaknesses,
    MemberInterests,
    MemberBio,
    MemberProfessionalInfo,
} from "../components";
import Navbar from "../../../Global_Components/navBar";
import MemberPointsHistory from "../components/stats/MemberPointsHistory";
import { MemberTasksList } from "../../Tasks";
import { MemberTeamsList } from "../../Teams";
import { useMember, useUpdateMember, useAddComplaint, useDeleteMember } from "../hooks/useMembers";
import type { Member } from "../types";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { Loader } from "lucide-react";

export default function MemberDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { role, user } = useAuth();
    const canEdit = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');
    
    // If we're on /me, use the current user's ID
    const effectiveId = id || user?.id;
    const isOwnProfile = user?.id === effectiveId;

    const { data: member, isLoading: loading } = useMember(effectiveId);
    const updateMutation = useUpdateMember();
    const complaintMutation = useAddComplaint();
    const deleteMutation = useDeleteMember();

    const handleUpdate = async (updates: Partial<Member>) => {
        if (!member) return;
        try {
            await updateMutation.mutateAsync({ id: member.id, updates });
            toast.success("Member updated successfully");
        } catch (error) {
            toast.error("Failed to update member");
        }
    };

    const handleDelete = async () => {
        if (!member) return;
        try {
            await deleteMutation.mutateAsync(member.id);
            toast.success("Member deleted successfully");
            navigate('/members');
        } catch (error) {
            toast.error("Failed to delete member");
        }
    };
    
    const handleAddComplaint = async (content: string) => {
        if (!member) return;
        try {
            await complaintMutation.mutateAsync({ memberId: member.id, content });
            toast.success("Complaint added");
        } catch (error) {
            toast.error("Failed to add complaint");
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">

        <Loader className="animate-spin" />
        <p>Loading member details...</p>


    </div>;
    if (!member) return null;

    return (
          <div className="min-h-screen bg-gray-50">
              <Navbar />
                  <main className="md:ml-64 pt-16 md:pt-6">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button 
                onClick={() => navigate('/members')}
                className="mb-6 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                ← Back to Members
            </button>

            <div className="mb-8">
                <MemberHeader 
                    member={member} 
                    rankPosition={member.rankPos?.toString() || member.role} 
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
                <MemberProfessionalInfo 
                    member={member} 
                    onUpdate={handleUpdate}
                    readOnly={!isOwnProfile && !canEdit}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column (Status & Points) */}
                <div className="space-y-8 lg:col-span-1">
                    <MemberStatus 
                        isValidated={member.is_validated}
                        cotisation={member.cotisation_status}
                        onValidationChange={(val) => handleUpdate({ is_validated: val })}
                        onCotisationChange={(cot) => handleUpdate({ cotisation_status: cot })}
                        readOnly={!canEdit}
                    />
                    
                    <MemberPoints 
                        points={member.points}
                        onPointsChange={(pts) => handleUpdate({ points: pts })}
                        readOnly={!canEdit}
                    />
                </div>

                {/* Middle Column (Info & Activities) */}
                <div className="space-y-8 lg:col-span-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                        <MemberInterests 
                            memberId={member.id}
                            readOnly={!isOwnProfile && !canEdit}
                        />
                        <MemberBio 
                            description={member.description}
                            onUpdate={(desc) => handleUpdate({ description: desc })}
                            readOnly={!isOwnProfile && !canEdit}
                        />
                    </div>
                </div>
                    <MemberStrengths 
                            strengths={member.strengths || []}
                            onUpdate={(str: string[]) => handleUpdate({ strengths: str })}
                            readOnly={!isOwnProfile && !canEdit}
                        />
                        <MemberWeaknesses 
                            weaknesses={member.weaknesses || []}
                            onUpdate={(weak: string[]) => handleUpdate({ weaknesses: weak })}
                            readOnly={!isOwnProfile && !canEdit}
                        />
                 {/* Right Column (Activities, Objectives & Complaints) */}
                 <div className="space-y-8 lg:col-span-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <MemberPointsProgress memberId={member.id} currentPoints={member.points} />
                    <MemberObjectives memberId={member.id} isAdmin={canEdit} />
                   
               
                    
                     </div>
                    <MemberActivities memberId={member.id} />

                     <MemberTasksList memberId={member.id} isAdmin={canEdit} />
                  

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                      <MemberTeamsList memberId={member.id} />
                   
                    <MemberComplaints 
                        complaints={member.complaints || []}
                        onAddComplaint={handleAddComplaint}
                        readOnly={!isOwnProfile}
                        />
                        </div>
                    <MemberPointsHistory memberId={member.id} />
                </div>
            </div>
            </div>
                        </main>
        </div>
    );
}
