-- 10 drivers + 20 passengers. supabase_auth_id is left null for local seeds.
INSERT INTO users (id, phone, name, photo_url, gender, role, trust_score, aadhaar_verified, dl_verified, face_match_done, preferred_language) VALUES
  ('11111111-1111-1111-1111-111111111101', '+919876543201', 'Arjun Mehta', NULL, 'male', 'driver', 92, true, true, true, 'en'),
  ('11111111-1111-1111-1111-111111111102', '+919876543202', 'Priya Nair', NULL, 'female', 'driver', 88, true, true, true, 'en'),
  ('11111111-1111-1111-1111-111111111103', '+919876543203', 'Karthik Raman', NULL, 'male', 'driver', 81, true, true, true, 'ta'),
  ('11111111-1111-1111-1111-111111111104', '+919876543204', 'Ananya Sharma', NULL, 'female', 'both', 95, true, true, true, 'hi'),
  ('11111111-1111-1111-1111-111111111105', '+919876543205', 'Rohit Iyer', NULL, 'male', 'driver', 74, true, true, true, 'en'),
  ('11111111-1111-1111-1111-111111111106', '+919876543206', 'Meera Krishnan', NULL, 'female', 'driver', 90, true, true, true, 'ta'),
  ('11111111-1111-1111-1111-111111111107', '+919876543207', 'Vikram Singh', NULL, 'male', 'driver', 69, true, true, false, 'hi'),
  ('11111111-1111-1111-1111-111111111108', '+919876543208', 'Sneha Patel', NULL, 'female', 'driver', 86, true, true, true, 'en'),
  ('11111111-1111-1111-1111-111111111109', '+919876543209', 'Aditya Rao', NULL, 'male', 'both', 78, true, true, true, 'en'),
  ('11111111-1111-1111-1111-111111111110', '+919876543210', 'Divya Menon', NULL, 'female', 'driver', 93, true, true, true, 'en'),
  ('22222222-2222-2222-2222-222222222201', '+919811112201', 'Rahul Verma', NULL, 'male', 'passenger', 70, true, false, true, 'hi'),
  ('22222222-2222-2222-2222-222222222202', '+919811112202', 'Lakshmi Subramanian', NULL, 'female', 'passenger', 84, true, false, true, 'ta'),
  ('22222222-2222-2222-2222-222222222203', '+919811112203', 'Amit Joshi', NULL, 'male', 'passenger', 62, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222204', '+919811112204', 'Neha Gupta', NULL, 'female', 'passenger', 88, true, false, true, 'hi'),
  ('22222222-2222-2222-2222-222222222205', '+919811112205', 'Sanjay Kumar', NULL, 'male', 'passenger', 55, false, false, false, 'en'),
  ('22222222-2222-2222-2222-222222222206', '+919811112206', 'Pooja Reddy', NULL, 'female', 'passenger', 79, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222207', '+919811112207', 'Farhan Ali', NULL, 'male', 'passenger', 71, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222208', '+919811112208', 'Kavya Iyer', NULL, 'female', 'passenger', 90, true, false, true, 'ta'),
  ('22222222-2222-2222-2222-222222222209', '+919811112209', 'Manish Agarwal', NULL, 'male', 'passenger', 66, true, false, true, 'hi'),
  ('22222222-2222-2222-2222-222222222210', '+919811112210', 'Aisha Khan', NULL, 'female', 'passenger', 82, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222211', '+919811112211', 'Nikhil Desai', NULL, 'male', 'passenger', 60, true, false, false, 'en'),
  ('22222222-2222-2222-2222-222222222212', '+919811112212', 'Shreya Banerjee', NULL, 'female', 'passenger', 77, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222213', '+919811112213', 'Hari Prasad', NULL, 'male', 'passenger', 73, true, false, true, 'ta'),
  ('22222222-2222-2222-2222-222222222214', '+919811112214', 'Ritu Malhotra', NULL, 'female', 'passenger', 85, true, false, true, 'hi'),
  ('22222222-2222-2222-2222-222222222215', '+919811112215', 'Varun Kapoor', NULL, 'male', 'passenger', 58, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222216', '+919811112216', 'Anjali Nambiar', NULL, 'female', 'passenger', 91, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222217', '+919811112217', 'Deepak Yadav', NULL, 'male', 'passenger', 64, true, false, true, 'hi'),
  ('22222222-2222-2222-2222-222222222218', '+919811112218', 'Ishita Bose', NULL, 'female', 'passenger', 80, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222219', '+919811112219', 'Pranav Kulkarni', NULL, 'male', 'passenger', 68, true, false, true, 'en'),
  ('22222222-2222-2222-2222-222222222220', '+919811112220', 'Tanvi Shah', NULL, 'female', 'passenger', 87, true, false, true, 'en');

INSERT INTO driver_profiles (user_id, dl_number, dl_expiry, years_of_experience, total_trips, cancellation_count, reliability_score, ifsc, bank_account_last4) VALUES
  ('11111111-1111-1111-1111-111111111101', 'MH12 20210012345', '2028-04-15', 6, 214, 3, 0.94, 'HDFC0001234', '4421'),
  ('11111111-1111-1111-1111-111111111102', 'KA03 20190054321', '2027-11-02', 5, 176, 2, 0.96, 'SBIN0002211', '8890'),
  ('11111111-1111-1111-1111-111111111103', 'TN07 20180099887', '2029-01-20', 7, 301, 5, 0.91, 'IOBA0003344', '1203'),
  ('11111111-1111-1111-1111-111111111104', 'DL01 20200077665', '2026-08-09', 4, 142, 1, 0.98, 'ICIC0005566', '3344'),
  ('11111111-1111-1111-1111-111111111105', 'TS09 20220033441', '2028-12-01', 3, 88, 4, 0.87, 'UTIB0007788', '5566'),
  ('11111111-1111-1111-1111-111111111106', 'KL01 20170011223', '2027-05-18', 8, 256, 2, 0.95, 'FDRL0009911', '7788'),
  ('11111111-1111-1111-1111-111111111107', 'RJ14 20210066778', '2026-03-30', 4, 97, 8, 0.79, 'PUNB0002233', '9900'),
  ('11111111-1111-1111-1111-111111111108', 'GJ01 20190044556', '2029-07-12', 5, 163, 3, 0.93, 'BARB0004455', '1122'),
  ('11111111-1111-1111-1111-111111111109', 'WB06 20200088990', '2027-09-25', 3, 71, 2, 0.90, 'CNRB0006677', '3345'),
  ('11111111-1111-1111-1111-111111111110', 'MH01 20180022334', '2028-02-14', 6, 198, 1, 0.97, 'KKBK0008899', '6677');

INSERT INTO vehicles (id, driver_id, make, model, color, registration_number, year, is_verified, vehicle_type) VALUES
  ('33333333-3333-3333-3333-333333330101', '11111111-1111-1111-1111-111111111101', 'Maruti', 'Swift Dzire', 'White', 'MH12AB4421', 2021, true, 'car'),
  ('33333333-3333-3333-3333-333333330102', '11111111-1111-1111-1111-111111111102', 'Hyundai', 'Creta', 'Grey', 'KA03CD8890', 2022, true, 'car'),
  ('33333333-3333-3333-3333-333333330103', '11111111-1111-1111-1111-111111111103', 'Honda', 'City', 'Silver', 'TN07EF1203', 2020, true, 'car'),
  ('33333333-3333-3333-3333-333333330104', '11111111-1111-1111-1111-111111111104', 'Tata', 'Nexon', 'Blue', 'DL01GH3344', 2023, true, 'car'),
  ('33333333-3333-3333-3333-333333330105', '11111111-1111-1111-1111-111111111105', 'Toyota', 'Innova Crysta', 'White', 'TS09IJ5566', 2019, true, 'car'),
  ('33333333-3333-3333-3333-333333330106', '11111111-1111-1111-1111-111111111106', 'Mahindra', 'XUV700', 'Black', 'KL01KL7788', 2023, true, 'car'),
  ('33333333-3333-3333-3333-333333330107', '11111111-1111-1111-1111-111111111107', 'Maruti', 'Ertiga', 'Red', 'RJ14MN9900', 2020, true, 'car'),
  ('33333333-3333-3333-3333-333333330108', '11111111-1111-1111-1111-111111111108', 'Kia', 'Seltos', 'White', 'GJ01OP1122', 2021, true, 'car'),
  ('33333333-3333-3333-3333-333333330109', '11111111-1111-1111-1111-111111111109', 'Hyundai', 'i20', 'Grey', 'WB06QR3345', 2022, true, 'car'),
  ('33333333-3333-3333-3333-333333330110', '11111111-1111-1111-1111-111111111110', 'Honda', 'Amaze', 'Silver', 'MH01ST6677', 2021, true, 'car');

INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Sonia Mehta', '+919812345001', 'spouse'),
  ('22222222-2222-2222-2222-222222222202', 'Ramesh Subramanian', '+919812345002', 'father'),
  ('22222222-2222-2222-2222-222222222204', 'Amit Gupta', '+919812345003', 'spouse');
