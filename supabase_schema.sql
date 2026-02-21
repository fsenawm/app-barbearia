-- Create Clients Table
create table clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  birth_date date,
  notes text,
  created_at timestamptz default now()
);

-- Create Services Table
create table services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price text,
  duration text,
  icon text,
  is_popular boolean default false,
  created_at timestamptz default now()
);

-- Create Appointments Table
create table appointments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  service_id uuid references services(id),
  appointment_date date not null,
  appointment_time text not null,
  is_confirmed boolean default true,
  created_at timestamptz default now()
);

-- Create Schedule Config Table (weekly working hours)
create table schedule_config (
  id uuid default gen_random_uuid() primary key,
  day_index int not null unique,  -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  day_name text not null,
  is_open boolean default true,
  start_time text not null default '09:00',
  end_time text not null default '18:00',
  updated_at timestamptz default now()
);

-- Create Schedule Blocks Table (blocked dates)
create table schedule_blocks (
  id uuid default gen_random_uuid() primary key,
  block_date date not null unique,
  reason text,
  created_at timestamptz default now()
);

-- Enable RLS (Optional but recommended for production)
-- For now, we allow all access as it's a demo
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table schedule_config enable row level security;
alter table schedule_blocks enable row level security;

create policy "Allow all for anon" on clients for all using (true) with check (true);
create policy "Allow all for anon" on services for all using (true) with check (true);
create policy "Allow all for anon" on appointments for all using (true) with check (true);
create policy "Allow all for anon" on schedule_config for all using (true) with check (true);
create policy "Allow all for anon" on schedule_blocks for all using (true) with check (true);

-- Insert initial services
insert into services (name, price, duration, icon, is_popular)
values 
  ('Corte', 'R$ 50,00', '45 min', 'content_cut', false),
  ('Barba', 'R$ 30,00', '30 min', 'face', false),
  ('Combo Especial', 'R$ 70,00', '60 min', 'auto_awesome', true),
  ('Sobrancelha', 'R$ 15,00', '15 min', 'brush', false);

-- Insert default schedule config
insert into schedule_config (day_index, day_name, is_open, start_time, end_time)
values
  (0, 'Domingo', false, '--:--', '--:--'),
  (1, 'Segunda-feira', true, '09:00', '18:00'),
  (2, 'Terça-feira', true, '09:00', '19:00'),
  (3, 'Quarta-feira', true, '09:00', '19:00'),
  (4, 'Quinta-feira', true, '09:00', '19:00'),
  (5, 'Sexta-feira', true, '09:00', '20:00'),
  (6, 'Sábado', true, '08:00', '17:00');
