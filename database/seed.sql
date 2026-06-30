-- ============================================================
-- SEED DATA: Demo companies, listings, transport details
-- Run AFTER schema.sql and migration_agents.sql
-- ============================================================

-- Demo Companies (industrial B2B focus)
INSERT INTO companies (id, owner_profile_id, company_name, afm, description, description_en, website, country, city, category, is_moderated, subscription_tier) VALUES
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'ΕΛΛΗΝΙΚΑ ΠΥΡΙΜΑΧΑ Α.Ε.', 'ΑΦΜ: 094012345', 'Κατασκευαστής πυρίμαχων υλικών για βιομηχανική χρήση. Εξειδίκευση σε τούβλα, κονιάματα και μονωτικά υλικά για κλιβάνους υψηλών θερμοκρασιών.', 'Manufacturer of refractory materials for industrial use. Specialized in bricks, mortars, and insulation for high-temperature kilns.', 'https://hellenic-refractories.gr', 'GR', 'Θεσσαλονίκη', 'factory', true, 'free'),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'MEDITERRANEAN STEEL WORKS LTD', 'VAT: EL098765432', 'Χαλυβουργία με έδρα τον Βόλο. Παράγουμε χάλυβα οπλισμού, δομικά προφίλ και βιομηχανικά ελάσματα για τις αγορές της Μεσογείου και των Βαλκανίων.', 'Steel mill based in Volos, Greece. We produce rebar, structural profiles, and industrial sheet metal for Mediterranean and Balkan markets.', 'https://med-steel.eu', 'GR', 'Βόλος', 'factory', true, 'premium'),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'BALKAN LOGISTICS GROUP', 'VAT: BG201234567', 'Διεθνείς μεταφορές και logistics. Εξυπηρετούμε Ελλάδα, Βουλγαρία, Ρουμανία, Τουρκία, Ιταλία. Στόλος 120+ φορτηγών, ψυγεία, ADR πιστοποίηση.', 'International transport & logistics. Serving Greece, Bulgaria, Romania, Turkey, Italy. Fleet of 120+ trucks, refrigerated, ADR certified.', 'https://balkan-logistics.com', 'BG', 'Κωνσταντινούπολη', 'transport', true, 'basic'),
  ('a1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'IONIAN MARINE EQUIPMENT', 'VAT: IT01234567890', 'Κατασκευαστής ναυτιλιακού εξοπλισμού: αντλίες, βαλβίδες, συστήματα ψύξης για εμπορικά πλοία. Εξαγωγές σε 30+ χώρες.', 'Manufacturer of marine equipment: pumps, valves, cooling systems for commercial vessels. Exports to 30+ countries.', 'https://ionian-marine.it', 'IT', 'Πάτρα', 'factory', true, 'free'),
  ('a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'ANATOLIA TEXTILE INDUSTRY', 'VAT: TR9876543210', 'Βιομηχανική παραγωγή υφασμάτων και τεχνικών κλωστοϋφαντουργικών προϊόντων. Εξειδίκευση σε βαμβακερά και συνθετικά υφάσματα για ένδυση και επίπλωση.', 'Industrial textile and technical fabric production. Specialized in cotton and synthetic fabrics for apparel and furniture.', 'https://anatolia-textile.com.tr', 'TR', 'Σμύρνη', 'factory', true, 'basic'),
  ('a1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'CHINA PRECISION MACHINERY CO.', 'VAT: CN91310000MA1', 'Κατασκευαστής CNC μηχανημάτων ακριβείας, τόρνων, φρέζες και κέντρων κατεργασίας. Εξυπηρετούμε εργοστάσια στην Ευρώπη, Μέση Ανατολή και Αφρική.', 'Precision CNC machinery manufacturer: lathes, milling machines, and machining centers. Serving factories across Europe, Middle East, and Africa.', 'https://cn-precision.cn', 'CN', 'Σαγκάη', 'factory', true, 'premium'),
  ('a1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'BULGARIAN ROSE ESSENTIAL OILS', 'VAT: BG876543210', 'Απόσταξη και εξαγωγή αιθέριων ελαίων τριαντάφυλλου, λεβάντας και βοτάνων για τη βιομηχανία αρωμάτων και καλλυντικών. Πιστοποίηση ISO 9001, βιολογική παραγωγή.', 'Distillation and export of rose, lavender, and herb essential oils for the perfume and cosmetics industry. ISO 9001 certified, organic production.', 'https://bg-rose-oils.com', 'BG', 'Σόφια', 'business', true, 'free');

-- Transport details (for Balkan Logistics)
INSERT INTO transport_details (id, profile_id, company_id, countries_served, vehicle_types, has_refrigerated, has_adr) VALUES
  ('b2000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003',
   ARRAY['GR','BG','RO','TR','IT','RS','MK','AL','HU'],
   ARRAY['Φορτηγά 24t', 'Νταλίκες', 'Βυτία', 'Container', 'Ψυγεία'],
   true, true);

-- Demo Listings
INSERT INTO listings (id, profile_id, company_id, title, title_en, description, description_en, type, category, location, salary_min, salary_max, is_moderated, is_active) VALUES
  ('c3000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001',
   'Χειριστής CNC - Πλήρης Απασχόληση',
   'CNC Operator - Full Time',
   'Ζητείται έμπειρος χειριστής CNC (3+ χρόνια) για εργοστάσιο πυρίμαχων υλικών στη Θεσσαλονίκη. Γνώσεις G-code απαραίτητες.',
   'Experienced CNC operator (3+ years) needed for refractory materials factory in Thessaloniki. G-code knowledge required.',
   'job_offer', 'manufacturing', 'Θεσσαλονίκη, Ελλάδα', 18000, 24000, true, true),
  ('c3000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002',
   'Μηχανικός Παραγωγής - Χαλυβουργία',
   'Production Engineer - Steel Industry',
   'Θέση μηχανικού παραγωγής στη χαλυβουργία Mediterranean Steel στον Βόλο. Απαραίτητο πτυχίο Μηχανολόγου/Μεταλλειολόγου Μηχανικού.',
   'Production engineer position at Mediterranean Steel Works in Volos. Mechanical/Metallurgical Engineering degree required.',
   'job_offer', 'engineering', 'Βόλος, Ελλάδα', 28000, 38000, true, true),
  ('c3000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000004',
   'Ναυπηγός Μηχανικός - Εξαγωγικό Τμήμα',
   'Naval Engineer - Export Department',
   'Η Ionian Marine Equipment αναζητά Ναυπηγό Μηχανικό για το τμήμα εξαγωγών στην Πάτρα. Απαραίτητα άριστα Αγγλικά. Ταξίδια στο εξωτερικό 30%.',
   'Ionian Marine Equipment seeks Naval Engineer for export department in Patras. Excellent English required. International travel 30%.',
   'job_offer', 'engineering', 'Πάτρα, Ελλάδα', 30000, 42000, true, true),
  ('c3000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000005',
   'Υπεύθυνος Ποιοτικού Ελέγχου Υφασμάτων',
   'Fabric Quality Control Manager',
   'Βιομηχανία κλωστοϋφαντουργίας στη Σμύρνη αναζητά υπεύθυνο QC με εμπειρία σε βαμβακερά και συνθετικά υφάσματα.',
   'Textile industry in Izmir seeks QC manager with experience in cotton and synthetic fabrics.',
   'job_offer', 'quality', 'Σμύρνη, Τουρκία', 15000, 21000, true, true),
  ('c3000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000006',
   'Αντιπρόσωπος Πωλήσεων Βιομηχανικών Μηχανημάτων - Ευρώπη',
   'Industrial Machinery Sales Representative - Europe',
   'Κινέζικη εταιρεία CNC μηχανημάτων αναζητά αντιπρόσωπο πωλήσεων για την Ευρωπαϊκή αγορά. Γνώση μηχανολογικού εξοπλισμού απαραίτητη.',
   'Chinese CNC machinery company seeks sales representative for European market. Knowledge of mechanical equipment essential.',
   'job_offer', 'sales', 'Απομακρυσμένη (Remote), Ευρώπη', 35000, 55000, true, true);

-- Demo transport listing
INSERT INTO listings (id, profile_id, company_id, title, title_en, description, description_en, type, category, location, is_moderated, is_active) VALUES
  ('c3000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000003',
   'Μεταφορές Container - Διαδρομή Ελλάδα-Βουλγαρία',
   'Container Transport - Greece-Bulgaria Route',
   'Προσφέρουμε υπηρεσίες μεταφοράς container στη διαδρομή Θεσσαλονίκη-Σόφια-Βουκουρέστι. Εβδομαδιαία δρομολόγια, ανταγωνιστικές τιμές.',
   'Container transport services on Thessaloniki-Sofia-Bucharest route. Weekly schedules, competitive rates.',
   'service', 'logistics', 'Θεσσαλονίκη / Σόφια / Βουκουρέστι', true, true);
