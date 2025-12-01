create table scene_renders (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  scene_index int not null,
  status text check (status in ('pending', 'generating_keyframes', 'rendering_video', 'completed', 'failed')) default 'pending',
  
  start_frame_url text,
  end_frame_url text,
  video_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(project_id, scene_index)
);

alter table scene_renders enable row level security;

create policy "Users can view scene renders for own projects" on scene_renders
  for select using (
    exists ( select 1 from projects where id = scene_renders.project_id and user_id = (select auth.uid()) )
  );

create policy "Users can update scene renders for own projects" on scene_renders
  for update using (
    exists ( select 1 from projects where id = scene_renders.project_id and user_id = (select auth.uid()) )
  );
