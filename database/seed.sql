-- GIS-Based Civic Issue Reporting Platform
-- Demonstration Seed Data — Greater Chennai Corporation (GCC)
-- Database: gis_civic_platform

USE `gis_civic_platform`;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `feedback`;
TRUNCATE TABLE `resolutions`;
TRUNCATE TABLE `issue_status_history`;
TRUNCATE TABLE `work_orders`;
TRUNCATE TABLE `issue_images`;
TRUNCATE TABLE `issues`;
TRUNCATE TABLE `issue_categories`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `wards`;
TRUNCATE TABLE `departments`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departments (Greater Chennai Corporation / CMWSSB / TANGEDCO)
INSERT INTO `departments` (`id`, `name`, `code`, `description`, `contact_email`, `contact_phone`) VALUES
(1, 'Roads & Infrastructure (GCC)', 'ROADS', 'Maintenance of Chennai arterial roads, flyovers, pavements, and subways', 'roads@chennaicorporation.gov.in', '+91 44 2538 4520'),
(2, 'Solid Waste Management (GCC)', 'SANIT', 'Garbage clearing, bio-mining, street sweeping, and Urbaser Sumeet coordination', 'sanitation@chennaicorporation.gov.in', '+91 44 2538 4521'),
(3, 'Chennai Metro Water & Sewerage (CMWSSB)', 'WATER', 'Potable piped water distribution, sewage mains, and underground drainage', 'support@chennaimetrowater.in', '+91 44 4567 4567'),
(4, 'Electrical & Street Lighting (TANGEDCO/GCC)', 'ELEC', 'High-mast lights, LED corridor fixtures, and feeder pillar boxes', 'electrical@chennaicorporation.gov.in', '+91 44 2538 4523'),
(5, 'Public Health & Vector Control', 'HEALTH', 'Mosquito fogging, sanitary inspections, and community health hazards', 'health@chennaicorporation.gov.in', '+91 44 2538 4524');

-- 2. Wards (Official Greater Chennai Corporation Zones)
INSERT INTO `wards` (`id`, `ward_number`, `ward_name`, `zone`, `councillor_name`, `contact_phone`, `center_latitude`, `center_longitude`, `boundary_geojson`) VALUES
(1, 'WARD-117', 'T. Nagar Commercial Hub', 'Zone 10 - Kodambakkam', 'M. Saraswathi', '+91 94451 90117', 13.0418, 80.2341, '{"type":"Polygon","coordinates":[[[80.225,13.035],[80.245,13.035],[80.245,13.048],[80.225,13.048],[80.225,13.035]]]}'),
(2, 'WARD-173', 'Adyar Residential South', 'Zone 13 - Adyar', 'K. Jayaraman', '+91 94451 90173', 13.0012, 80.2565, '{"type":"Polygon","coordinates":[[[80.248,12.995],[80.265,12.995],[80.265,13.010],[80.248,13.010],[80.248,12.995]]]}'),
(3, 'WARD-104', 'Anna Nagar West Extension', 'Zone 8 - Anna Nagar', 'V. Elangovan', '+91 94451 90104', 13.0850, 80.2101, '{"type":"Polygon","coordinates":[[[80.200,13.078],[80.220,13.078],[80.220,13.092],[80.200,13.092],[80.200,13.078]]]}'),
(4, 'WARD-178', 'Velachery Lake Environs', 'Zone 13 - Adyar', 'P. Geetha', '+91 94451 90178', 12.9815, 80.2180, '{"type":"Polygon","coordinates":[[[80.210,12.972],[80.228,12.972],[80.228,12.990],[80.210,12.990],[80.210,12.972]]]}'),
(5, 'WARD-125', 'Mylapore Heritage Zone', 'Zone 9 - Teynampet', 'T. Sivakumar', '+91 94451 90125', 13.0336, 80.2677, '{"type":"Polygon","coordinates":[[[80.260,13.025],[80.275,13.025],[80.275,13.042],[80.260,13.042],[80.260,13.025]]]}'),
(6, 'WARD-081', 'Royapuram Harbour Belt', 'Zone 5 - Royapuram', 'A. Rahim', '+91 94451 90081', 13.1143, 80.2941, '{"type":"Polygon","coordinates":[[[80.285,13.105],[80.302,13.105],[80.302,13.125],[80.285,13.125],[80.285,13.105]]]}');

-- 3. Issue Categories
INSERT INTO `issue_categories` (`id`, `name`, `description`, `default_department_id`, `default_priority`, `sla_hours`, `icon`, `color_code`) VALUES
(1, 'Potholes and Damaged Roads', 'Crater-sized potholes, broken asphalt, and road cave-ins across Chennai roads', 1, 'high', 48, 'Hammer', '#EF4444'),
(2, 'Garbage Accumulation', 'Overflowing dumper bins, roadside debris, and vegetable market waste dumping', 2, 'medium', 24, 'Trash2', '#F59E0B'),
(3, 'Water Leakage', 'Burst Metrowater supply pipes, joint cracks, and drinking water wastage', 3, 'high', 24, 'Droplets', '#06B6D4'),
(4, 'Broken Streetlights', 'Dark corridors, non-functional LED fixtures, and damaged electrical pillars', 4, 'medium', 36, 'Lightbulb', '#EAB308'),
(5, 'Drainage and Sewage Problems', 'Choked stormwater drains, sewage overflow, and monsoon water stagnation', 3, 'urgent', 24, 'Waves', '#8B5CF6'),
(6, 'Damaged Public Infrastructure', 'Damaged pedestrian pavements, broken median railings, and open manholes', 1, 'low', 72, 'ShieldAlert', '#64748B'),
(7, 'Other Municipal Problems', 'Cattle/dog stray menace, mosquito infestation, and illegal banners', 5, 'low', 48, 'HelpCircle', '#10B981');

-- 4. Users (Password for all accounts is: Password@123)
-- Bcrypt hash: $2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `department_id`, `ward_id`, `badge_number`, `is_active`) VALUES
(1, 'GCC Zonal Commissioner', 'admin@civic.gov', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'admin', '+91 44 2538 4500', NULL, NULL, 'ADM-CHN-01', 1),
(2, 'K. Balaji (Roads Officer - Chennai)', 'officer.roads@civic.gov', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'officer', '+91 94441 22001', 1, 1, 'RO-GCC-117', 1),
(3, 'M. Kavitha (Sanitation Officer - Chennai)', 'officer.sanitation@civic.gov', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'officer', '+91 94441 22002', 2, 5, 'SO-GCC-125', 1),
(4, 'S. Murugan (Metrowater Officer)', 'officer.water@civic.gov', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'officer', '+91 94441 22003', 3, 2, 'WO-CMW-173', 1),
(5, 'R. Senthamil (Electrical Officer)', 'officer.electrical@civic.gov', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'officer', '+91 94441 22004', 4, 3, 'EO-GCC-104', 1),
(6, 'Karthik Subramanian (Chennai Citizen)', 'citizen@gmail.com', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'citizen', '+91 98401 55667', NULL, 1, NULL, 1),
(7, 'Priya Soundararajan (Chennai Citizen)', 'sarah.citizen@gmail.com', '$2a$10$ldZuqyjGSXM2Ku00BsXYqOGuG89D0/fGwZNTLhkjDcWaO.vOstEAy', 'citizen', '+91 98402 88990', NULL, 2, NULL, 1);

-- 5. Issues (Chennai Complaints with Accurate Chennai Coordinates)
INSERT INTO `issues` (`id`, `ticket_id`, `citizen_id`, `category_id`, `department_id`, `ward_id`, `title`, `description`, `latitude`, `longitude`, `location_type`, `address`, `priority`, `status`, `deadline`, `created_at`) VALUES
(1, 'TKT-20261020-001', 6, 1, 1, 1, 'Deep Crater Pothole on South Usman Road Near Ranganathan St', 'Major 2-foot wide crater on the main commercial corridor causing traffic bottleneck and bike skidding.', 13.04150000, 80.23350000, 'gps', 'South Usman Rd, Parthasarathi Puram, T. Nagar, Chennai, Tamil Nadu 600017', 'urgent', 'resolved', '2026-10-22 18:00:00', '2026-10-20 09:15:00'),
(2, 'TKT-20261021-002', 6, 2, 2, 5, 'Overflowing Garbage Bin Behind Mylapore Tank & Sannathi St', 'Commercial plastic debris and flower market waste uncollected for 3 days, causing foul stench.', 13.03320000, 80.26850000, 'map_click', 'Kapaleeswarar Sannadhi St, Vinayaka Nagar Colony, Mylapore, Chennai, Tamil Nadu 600004', 'high', 'in_progress', '2026-10-22 17:00:00', '2026-10-21 11:30:00'),
(3, 'TKT-20261021-003', 7, 3, 3, 2, 'Metrowater Pipe Burst Gushing Into Sardar Patel Road', 'Potable clean drinking water gushing across pedestrian pavement opposite Gandhi Mandapam corridor.', 13.00680000, 80.25200000, 'gps', 'Sardar Patel Rd, Guindy National Park Area, Adyar, Chennai, Tamil Nadu 600036', 'urgent', 'assigned', '2026-10-22 16:00:00', '2026-10-21 14:45:00'),
(4, 'TKT-20261022-004', 6, 4, 4, 3, 'Consecutive Streetlights Off on 2nd Avenue Anna Nagar', 'Four streetlights are dead on the 2nd Avenue stretch near Roundtana, creating an unsafe dark zone.', 13.08480000, 80.21550000, 'manual', '2nd Ave, A Block, Anna Nagar, Chennai, Tamil Nadu 600102', 'medium', 'pending', '2026-10-23 20:00:00', '2026-10-22 08:10:00'),
(5, 'TKT-20261022-005', 7, 5, 3, 4, 'Stormwater Drain Choked Causing Sewage Stagnation at Velachery', 'Underground stormwater drain blocked near Velachery MRTS station, causing sewage stagnation.', 12.97900000, 80.22050000, 'gps', 'Velachery Bypass Rd, Dhandeeswaram Nagar, Velachery, Chennai, Tamil Nadu 600042', 'high', 'pending', '2026-10-23 14:00:00', '2026-10-22 09:20:00'),
(6, 'TKT-20261022-006', 6, 6, 1, 6, 'Damaged Pedestrian Slabs on Ibrahim Sahib Street Royapuram', 'Cracked concrete pedestrian slabs with exposed rebar posing injury risk to commuters walking to harbour.', 13.11400000, 80.29400000, 'gps', 'Ibrahim Sahib St, Royapuram, Chennai, Tamil Nadu 600013', 'medium', 'pending', '2026-10-24 12:00:00', '2026-10-22 10:15:00');

-- 6. Issue Images
INSERT INTO `issue_images` (`id`, `issue_id`, `image_url`, `image_type`, `uploaded_by`, `caption`, `file_size`) VALUES
(1, 1, '/uploads/sample_pothole_before.jpg', 'complaint', 6, 'Deep crater pothole in central driving lane', 420000),
(2, 1, '/uploads/sample_pothole_after.jpg', 'resolution', 2, 'Pothole cold-patched and steam-rolled with bitumen', 380000),
(3, 2, '/uploads/sample_garbage.jpg', 'complaint', 6, 'Uncleared roadside dumpster accumulation', 512000),
(4, 3, '/uploads/sample_water_leak.jpg', 'complaint', 7, 'Metrowater underground pipeline spraying clean water', 490000);

-- 7. Work Orders
INSERT INTO `work_orders` (`id`, `issue_id`, `officer_id`, `assigned_by`, `department_id`, `status`, `instructions`, `assigned_at`, `accepted_at`, `completed_at`) VALUES
(1, 1, 2, 1, 1, 'completed', 'Urgent bitumen patching required on Usman Road before evening bus rush.', '2026-10-20 10:00:00', '2026-10-20 10:30:00', '2026-10-21 16:00:00'),
(2, 2, 3, 1, 2, 'in_progress', 'Deploy compact waste collection truck and wash surroundings with bleaching powder.', '2026-10-21 12:00:00', '2026-10-21 12:45:00', NULL),
(3, 3, 4, 1, 3, 'assigned', 'Isolate local distribution valve, replace cracked CI joint pipe.', '2026-10-21 15:00:00', NULL, NULL);

-- 8. Issue Status History
INSERT INTO `issue_status_history` (`id`, `issue_id`, `changed_by`, `previous_status`, `new_status`, `remarks`, `created_at`) VALUES
(1, 1, 6, NULL, 'pending', 'Complaint submitted via citizen portal with Chennai GPS coordinates', '2026-10-20 09:15:00'),
(2, 1, 1, 'pending', 'assigned', 'Assigned to GCC Roads Officer K. Balaji (Work Order #1)', '2026-10-20 10:00:00'),
(3, 1, 2, 'assigned', 'in_progress', 'Road repair crew dispatched with hot bitumen mix', '2026-10-20 10:30:00'),
(4, 1, 2, 'in_progress', 'resolved', 'Bitumen patch compacted. Road reopened for vehicular traffic on Usman Rd.', '2026-10-21 16:00:00'),
(5, 2, 6, NULL, 'pending', 'Complaint registered with map location in Mylapore', '2026-10-21 11:30:00'),
(6, 2, 1, 'pending', 'assigned', 'Assigned to GCC Sanitation Officer M. Kavitha', '2026-10-21 12:00:00'),
(7, 2, 3, 'assigned', 'in_progress', 'Urbaser truck team on site clearing waste bins', '2026-10-21 12:45:00'),
(8, 3, 7, NULL, 'pending', 'Urgent Metrowater leak reported on Sardar Patel Rd Adyar', '2026-10-21 14:45:00'),
(9, 3, 1, 'pending', 'assigned', 'Work order dispatched to Metrowater Engineer S. Murugan', '2026-10-21 15:00:00'),
(10, 4, 6, NULL, 'pending', 'Anna Nagar streetlights issue logged', '2026-10-22 08:10:00'),
(11, 5, 7, NULL, 'pending', 'Velachery stormwater drain stagnation reported', '2026-10-22 09:20:00'),
(12, 6, 6, NULL, 'pending', 'Royapuram pedestrian sidewalk hazard reported', '2026-10-22 10:15:00');

-- 9. Resolutions
INSERT INTO `resolutions` (`id`, `issue_id`, `work_order_id`, `resolved_by`, `resolution_notes`, `completion_photo_url`, `resolved_at`) VALUES
(1, 1, 1, 2, 'Inspected pothole depth on South Usman Rd (14cm). Excavated loose aggregate, applied tack coat followed by 50mm dense bituminous macadam. Compacted with 4-ton vibrating roller. Traffic restored smoothly.', '/uploads/sample_pothole_after.jpg', '2026-10-21 16:00:00');

-- 10. Feedback
INSERT INTO `feedback` (`id`, `issue_id`, `citizen_id`, `is_satisfied`, `rating`, `comments`, `reopen_requested`) VALUES
(1, 1, 6, 1, 5, 'Commendable speed by GCC! The pothole on Usman Road was filled within 24 hours. Great work.', 0);

-- 11. Notifications
INSERT INTO `notifications` (`id`, `user_id`, `issue_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 6, 1, 'Complaint Resolved', 'Your complaint TKT-20261020-001 regarding "Deep Crater Pothole on South Usman Road" has been resolved by GCC. Please inspect and rate.', 'resolution', 1, '2026-10-21 16:01:00'),
(2, 6, 2, 'Work In Progress', 'Work order #2 has been accepted by Sanitation crew for complaint TKT-20261021-002 in Mylapore.', 'status_update', 0, '2026-10-21 12:46:00'),
(3, 4, 3, 'New Work Order Assigned', 'You have been assigned work order #3 for urgent Metrowater pipe leak at Sardar Patel Road, Adyar.', 'assignment', 0, '2026-10-21 15:00:00');

-- 12. Audit Logs
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 6, 'ISSUE_CREATED', 'issue', 1, '{"ticket_id": "TKT-20261020-001", "city": "Chennai", "ward": "WARD-117"}', '127.0.0.1', '2026-10-20 09:15:00'),
(2, 1, 'ISSUE_ASSIGNED', 'issue', 1, '{"officer_id": 2, "department_id": 1, "work_order_id": 1}', '127.0.0.1', '2026-10-20 10:00:00'),
(3, 2, 'ISSUE_RESOLVED', 'issue', 1, '{"resolution_notes": "Bitumen patch compacted on Usman Rd."}', '127.0.0.1', '2026-10-21 16:00:00'),
(4, 6, 'FEEDBACK_SUBMITTED', 'issue', 1, '{"rating": 5, "city": "Chennai"}', '127.0.0.1', '2026-10-21 16:45:00');
