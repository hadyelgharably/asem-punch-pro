CREATE TYPE public.app_role AS ENUM ('admin','client');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_email()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

CREATE TABLE public.coach_allowlist (
  email text PRIMARY KEY
);
GRANT SELECT ON public.coach_allowlist TO authenticated;
GRANT ALL ON public.coach_allowlist TO service_role;
ALTER TABLE public.coach_allowlist ENABLE ROW LEVEL SECURITY;
INSERT INTO public.coach_allowlist(email) VALUES ('coach@asemmma.com');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.coach_allowlist WHERE email = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "allowlist admin read" ON public.coach_allowlist FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  total_sessions integer NOT NULL,
  duration_days integer NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages readable" ON public.packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "packages admin write" ON public.packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  user_email text NOT NULL,
  phone text,
  photo_url text,
  notes text,
  join_date date NOT NULL DEFAULT current_date,
  current_subscription_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX clients_user_email_lower_idx ON public.clients (lower(user_email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients own read" ON public.clients FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR lower(user_email) = public.current_email());
CREATE POLICY "clients admin write" ON public.clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.packages(id),
  start_date date NOT NULL DEFAULT current_date,
  end_date date NOT NULL,
  total_sessions integer NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs own read" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = subscriptions.client_id AND lower(c.user_email) = public.current_email()));
CREATE POLICY "subs admin insert" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs admin update" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.clients
  ADD CONSTRAINT clients_current_subscription_fkey
  FOREIGN KEY (current_subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  client_email text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Attended',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX attendance_one_attended_per_day
  ON public.attendance (client_id, (((occurred_at AT TIME ZONE 'UTC')::date)))
  WHERE status = 'Attended';
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance own read" ON public.attendance FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR lower(client_email) = public.current_email());
CREATE POLICY "attendance admin insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "attendance admin update" ON public.attendance FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.packages (id, package_name, total_sessions, duration_days, price, description) VALUES
 ('11111111-1111-1111-1111-111111111101','8 Sessions',8,30,1500,'8 training sessions valid for 30 days'),
 ('11111111-1111-1111-1111-111111111102','12 Sessions',12,45,2100,'12 training sessions valid for 45 days'),
 ('11111111-1111-1111-1111-111111111103','16 Sessions',16,60,2700,'16 training sessions valid for 60 days'),
 ('11111111-1111-1111-1111-111111111104','20 Sessions',20,90,3200,'20 training sessions valid for 90 days');

INSERT INTO public.clients (id, client_code, full_name, user_email, phone, join_date, notes) VALUES
 ('22222222-2222-2222-2222-222222222201','ASEM001','Ahmed Ali','ahmed.ali@asemmma.com','+20 100 111 2201', current_date - 120, 'Striking focus'),
 ('22222222-2222-2222-2222-222222222202','ASEM002','Omar Hassan','omar.hassan@asemmma.com','+20 100 111 2202', current_date - 90, 'Grappling focus'),
 ('22222222-2222-2222-2222-222222222203','ASEM003','Youssef Mohamed','youssef.mohamed@asemmma.com','+20 100 111 2203', current_date - 200, NULL),
 ('22222222-2222-2222-2222-222222222204','ASEM004','Karim Ahmed','karim.ahmed@asemmma.com','+20 100 111 2204', current_date - 70, NULL),
 ('22222222-2222-2222-2222-222222222205','ASEM005','Mahmoud Adel','mahmoud.adel@asemmma.com','+20 100 111 2205', current_date - 30, 'Fight camp');

INSERT INTO public.subscriptions (id, client_id, package_id, start_date, end_date, total_sessions, status) VALUES
 ('33333333-3333-3333-3333-333333333301','22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111102', current_date - 60, current_date - 15, 12, 'Expired'),
 ('33333333-3333-3333-3333-333333333302','22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111102', current_date, current_date + 45, 12, 'Active'),
 ('33333333-3333-3333-3333-333333333303','22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111102', current_date - 20, current_date + 25, 12, 'Active'),
 ('33333333-3333-3333-3333-333333333304','22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111101', current_date - 45, current_date - 10, 8, 'Expired'),
 ('33333333-3333-3333-3333-333333333305','22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111101', current_date - 25, current_date + 5, 8, 'Active'),
 ('33333333-3333-3333-3333-333333333306','22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111104', current_date - 15, current_date + 75, 20, 'Active');

UPDATE public.clients SET current_subscription_id = '33333333-3333-3333-3333-333333333302' WHERE id = '22222222-2222-2222-2222-222222222201';
UPDATE public.clients SET current_subscription_id = '33333333-3333-3333-3333-333333333303' WHERE id = '22222222-2222-2222-2222-222222222202';
UPDATE public.clients SET current_subscription_id = '33333333-3333-3333-3333-333333333304' WHERE id = '22222222-2222-2222-2222-222222222203';
UPDATE public.clients SET current_subscription_id = '33333333-3333-3333-3333-333333333305' WHERE id = '22222222-2222-2222-2222-222222222204';
UPDATE public.clients SET current_subscription_id = '33333333-3333-3333-3333-333333333306' WHERE id = '22222222-2222-2222-2222-222222222205';

INSERT INTO public.attendance (client_id, subscription_id, client_email, occurred_at, status)
SELECT '22222222-2222-2222-2222-222222222201','33333333-3333-3333-3333-333333333301','ahmed.ali@asemmma.com',
       (current_date - (20 + g*4))::timestamptz + interval '18 hours','Attended'
FROM generate_series(1,10) g;

INSERT INTO public.attendance (client_id, subscription_id, client_email, occurred_at, status)
SELECT '22222222-2222-2222-2222-222222222202','33333333-3333-3333-3333-333333333303','omar.hassan@asemmma.com',
       (current_date - (g + 1))::timestamptz + interval '19 hours','Attended'
FROM generate_series(1,9) g;

INSERT INTO public.attendance (client_id, subscription_id, client_email, occurred_at, status)
SELECT '22222222-2222-2222-2222-222222222203','33333333-3333-3333-3333-333333333304','youssef.mohamed@asemmma.com',
       (current_date - (20 + g*3))::timestamptz + interval '17 hours','Attended'
FROM generate_series(1,3) g;

INSERT INTO public.attendance (client_id, subscription_id, client_email, occurred_at, status)
SELECT '22222222-2222-2222-2222-222222222204','33333333-3333-3333-3333-333333333305','karim.ahmed@asemmma.com',
       (current_date - (2 + g*2))::timestamptz + interval '20 hours','Attended'
FROM generate_series(1,8) g;

INSERT INTO public.attendance (client_id, subscription_id, client_email, occurred_at, status)
SELECT '22222222-2222-2222-2222-222222222205','33333333-3333-3333-3333-333333333306','mahmoud.adel@asemmma.com',
       (current_date - (g*2))::timestamptz + interval '18 hours','Attended'
FROM generate_series(1,5) g;

INSERT INTO public.attendance (client_id, subscription_id, client_email, occurred_at, status, notes) VALUES
 ('22222222-2222-2222-2222-222222222205','33333333-3333-3333-3333-333333333306','mahmoud.adel@asemmma.com', (current_date - 11)::timestamptz + interval '18 hours','No Show','Did not show up'),
 ('22222222-2222-2222-2222-222222222202','33333333-3333-3333-3333-333333333303','omar.hassan@asemmma.com', (current_date - 12)::timestamptz + interval '19 hours','Cancelled','Cancelled in advance');
