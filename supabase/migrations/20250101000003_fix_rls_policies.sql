-- Fix RLS policies for scripts
create policy "Users can insert scripts for own projects" on scripts
  for insert with check (
    exists ( select 1 from projects where id = scripts.project_id and user_id = (select auth.uid()) )
  );

create policy "Users can update scripts for own projects" on scripts
  for update using (
    exists ( select 1 from projects where id = scripts.project_id and user_id = (select auth.uid()) )
  );

-- Fix RLS policies for assets
create policy "Users can insert assets for own projects" on assets
  for insert with check (
    exists ( select 1 from projects where id = assets.project_id and user_id = (select auth.uid()) )
  );

create policy "Users can update assets for own projects" on assets
  for update using (
    exists ( select 1 from projects where id = assets.project_id and user_id = (select auth.uid()) )
  );

-- Fix RLS policies for scene_renders (missing insert)
create policy "Users can insert scene renders for own projects" on scene_renders
  for insert with check (
    exists ( select 1 from projects where id = scene_renders.project_id and user_id = (select auth.uid()) )
  );
