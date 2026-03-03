-- Migration: create workout_exercises
-- Run this in Supabase SQL editor (Database → SQL Editor)

-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid not null,
  exercise_id uuid not null,
  weight numeric,
  reps int,
  sets int,
  created_at timestamptz default now()
);

alter table public.workout_exercises
  add constraint fk_workout_exercises_workout foreign key (workout_id) references public.workouts(id) on delete cascade,
  add constraint fk_workout_exercises_exercise foreign key (exercise_id) references public.exercises(id) on delete restrict;

-- Grant basic permissions to anon (adjust if you use RLS or different roles)
grant select, insert, update, delete on public.workout_exercises to anon;

-- If you use Row Level Security (RLS), create policies instead of broad grants.
-- Example policy allowing authenticated users to insert/select their own rows (requires user_id column on workouts):
-- alter table public.workout_exercises enable row level security;
-- create policy "Allow logged users" on public.workout_exercises for all using (true) with check (true);

-- End migration
