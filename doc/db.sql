Table users {
  id integer [pk, increment]
  email varchar [unique, not null]
  password_hash varchar [not null]
  role varchar [not null, note: 'visitor | ehost | admin']
  first_name varchar
  last_name varchar
  date_of_birth date
  country varchar
  language varchar
  bio text
  profile_image varchar
  status varchar [default: 'active', note: 'active | suspended']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  auth_provider varchar [default: 'local', note: 'local | google']
}

Table experiences {
  id integer [pk, increment]
  ehost_id integer [ref: > users.id]
  title varchar [not null]
  description text
  category varchar
  country varchar
  location_name varchar
  latitude numeric
  longitude numeric
  date_time timestamp
  duration_minutes integer
  max_visitors integer
  price numeric
  price_discounted numeric
  cover_image varchar
  status varchar [default: 'pending']
  rejection_reason text
  gender_preference varchar [default: 'any']
  allows_piggyback boolean [default: false]
  sample_video_url varchar
  continent varchar
  video_description text
  video_highlights array
  language text [not null, default: 'English']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table bookings {
  id integer [pk, increment]
  visitor_id integer [ref: > users.id]
  experience_id integer [ref: > experiences.id]
  booking_date timestamp [default: `CURRENT_TIMESTAMP`]
  amount_paid numeric
  booking_type varchar [default: 'full']
  meeting_link varchar
  status varchar [default: 'confirmed']
  qty_normal integer [default: 1]
  qty_discounted integer [default: 0]
  contact_name varchar
  contact_email varchar
  reschedule_date timestamp
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table payments {
  id integer [pk, increment]
  booking_id integer [ref: > bookings.id]
  visitor_id integer [ref: > users.id]
  amount numeric
  method varchar
  transaction_id varchar
  status varchar [default: 'completed']
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table refunds {
  id integer [pk, increment]
  booking_id integer [ref: > bookings.id]
  payment_id integer [ref: > payments.id]
  refund_amount numeric
  refund_percentage integer
  days_before_event integer
  status varchar [default: 'pending']
  reason text
  processed_at timestamp
}

Table reviews {
  id integer [pk, increment]
  visitor_id integer [ref: > users.id]
  experience_id integer [ref: > experiences.id]
  rating integer [note: '1–5']
  comment text
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table experience_scores {
  id integer [pk, increment]
  experience_id integer [ref: > experiences.id]
  admin_id integer [ref: > users.id]
  wifi_score integer
  safety_score integer
  legal_score integer
  content_score integer
  accessibility_score integer
  description_score integer
  pricing_score integer
  total_score integer
  result varchar
  comment text
  scored_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table user_agreements {
  id integer [pk, increment]
  user_id integer [ref: > users.id]
  is_over_18 boolean [not null]
  accepted_terms boolean [not null]
  accepted_behaviour boolean [not null]
  accepted_recording boolean [not null]
  payment_method_on_file varchar
  accepted_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table network_logs {
  id integer [pk, increment]
  user_id integer [ref: > users.id]
  experience_id integer [ref: > experiences.id]
  connection_quality varchar
  ip_address varchar
  error_details text
  logged_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table ehost_applications {
  id integer [pk, increment]
  name text [not null]
  birthday date [not null]
  nationality text [not null]
  email text [unique, not null]
  has_experience boolean [not null]
  years_of_experience integer [default: 0]
  past_journey_info text
  preferred_country text [not null]
  preferred_spot_types jsonb
  description text [not null]
  video_link text [not null]
  is_contract_agreed boolean [not null]
  status text [default: 'pending']
  created_at timestamptz [default: `now()`]
}