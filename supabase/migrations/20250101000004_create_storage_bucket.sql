-- Create storage bucket for assets
insert into storage.buckets (id, name, public) values ('project-assets', 'project-assets', true);

-- Policy to allow authenticated uploads
create policy "Authenticated users can upload assets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'project-assets' );

-- Policy to allow public read (for displaying in UI)
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'project-assets' );
