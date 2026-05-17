-- Migration to add is_available column to rentbikes table
alter table rentbikes add column if not exists is_available boolean default true;
