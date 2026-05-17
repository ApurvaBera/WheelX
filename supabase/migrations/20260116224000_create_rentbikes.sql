create table if not exists rentbikes (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  company text not null,
  model text not null,
  price text,
  location text,
  images text[],
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

alter table rentbikes enable row level security;

create policy "Public rentals are viewable by everyone" on rentbikes
  for select using (true);

create policy "Users can insert their own rentals" on rentbikes
  for insert with check (auth.uid() = owner_id);

create policy "Users can update their own rentals" on rentbikes
  for update using (auth.uid() = owner_id);

create policy "Users can delete their own rentals" on rentbikes
  for delete using (auth.uid() = owner_id);
