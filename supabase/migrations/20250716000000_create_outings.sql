CREATE TYPE outing_category AS ENUM ('study', 'fun', 'knowing_each_other', 'cultural', 'sport', 'other');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE outings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category outing_category NOT NULL DEFAULT 'other',
  cover_image TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  max_participants INTEGER NOT NULL CHECK (max_participants > 0),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE outing_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(outing_id, user_id)
);

CREATE TABLE outing_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(outing_id, invitee_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can view outings" ON outings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can create outings" ON outings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "owners can update their outings" ON outings
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "owners can delete their outings" ON outings
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "authenticated users can view members" ON outing_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can join" ON outing_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "users can leave" ON outing_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "authenticated users can view invitations" ON outing_invitations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "owners can create invitations" ON outing_invitations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "invitees can update their invitations" ON outing_invitations
  FOR UPDATE USING (auth.uid() = invitee_id);

CREATE POLICY "users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "system can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE outings;
ALTER PUBLICATION supabase_realtime ADD TABLE outing_members;
ALTER PUBLICATION supabase_realtime ADD TABLE outing_invitations;
