import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON file
function readDataFile<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error(`Error reading database file ${filename}:`, error);
    return [];
  }
}

// Helper to write JSON file
function writeDataFile<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing database file ${filename}:`, error);
  }
}

// Generate unique string ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Generic Model Simulator representing Mongoose Model API
export class ModelSimulator<T extends { _id: string; createdAt?: string }> {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  public find(query?: Partial<T> | ((item: T) => boolean)): T[] {
    const data = readDataFile<T>(this.filename);
    if (!query) return data;
    if (typeof query === 'function') {
      return data.filter(query);
    }
    return data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  public findOne(query: Partial<T> | ((item: T) => boolean)): T | null {
    const results = this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  public findById(id: string): T | null {
    return this.findOne({ _id: id } as any);
  }

  public create(doc: Omit<T, '_id' | 'createdAt'>): T {
    const data = readDataFile<T>(this.filename);
    const newDoc = {
      ...doc,
      _id: generateId(),
      createdAt: new Date().toISOString()
    } as unknown as T;
    
    data.push(newDoc);
    writeDataFile(this.filename, data);
    return newDoc;
  }

  public findByIdAndUpdate(id: string, update: Partial<T>, options: { new?: boolean } = {}): T | null {
    const data = readDataFile<T>(this.filename);
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...data[index],
      ...update
    };

    data[index] = updatedItem;
    writeDataFile(this.filename, data);
    return updatedItem;
  }

  public findByIdAndDelete(id: string): T | null {
    const data = readDataFile<T>(this.filename);
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;

    const [deleted] = data.splice(index, 1);
    writeDataFile(this.filename, data);
    return deleted;
  }

  public countDocuments(query?: Partial<T>): number {
    return this.find(query).length;
  }
}

// Interfaces matching requested Mongoose Schemas
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
}

export interface Training {
  _id: string;
  title: string;
  description: string;
  trainer: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  participantLimit: number;
  registeredCount: number;
  status: 'open' | 'full' | 'closed';
  createdAt: string;
}

export interface Registration {
  _id: string;
  user: string; // User ID
  training: string; // Training ID
  attendanceStatus: 'pending' | 'present' | 'absent';
  completionStatus: 'ongoing' | 'completed' | 'failed';
  registeredAt: string;
}

export interface Certificate {
  _id: string;
  user: string; // User ID
  training: string; // Training ID
  certificateNumber: string;
  issuedDate: string;
}

export interface Activity {
  _id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  activityDate: string;
  createdAt: string;
}

export interface News {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

// Export specific model simulators
export const UserDb = new ModelSimulator<User>('users.json');
export const TrainingDb = new ModelSimulator<Training>('trainings.json');
export const RegistrationDb = new ModelSimulator<Registration>('registrations.json');
export const CertificateDb = new ModelSimulator<Certificate>('certificates.json');
export const ActivityDb = new ModelSimulator<Activity>('activities.json');
export const NewsDb = new ModelSimulator<News>('news.json');

// Auto-seed Initial Database on server startup
export async function seedDatabase(): Promise<void> {
  console.log('Verifying database seed data...');

  // 1. Seed Users
  if (UserDb.countDocuments() === 0) {
    console.log('Seeding default users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedUserPassword = await bcrypt.hash('user123', 10);
    const hashedTesterPassword = await bcrypt.hash('test123', 10);

    UserDb.create({
      name: 'Super Admin',
      email: 'admin@healthcare.org',
      phone: '+1 (555) 0199',
      password: hashedAdminPassword,
      role: 'admin',
      isActive: true
    });

    UserDb.create({
      name: 'John Doe',
      email: 'user@healthcare.org',
      phone: '+1 (555) 0188',
      password: hashedUserPassword,
      role: 'user',
      isActive: true
    });

    UserDb.create({
      name: 'Jane Smith',
      email: 'tester@healthcare.org',
      phone: '+1 (555) 0177',
      password: hashedTesterPassword,
      role: 'user',
      isActive: true
    });
  }

  // 2. Seed Trainings
  if (TrainingDb.countDocuments() === 0) {
    console.log('Seeding default trainings...');
    
    // An Open Training
    TrainingDb.create({
      title: 'Cardiovascular Life Support (ACLS)',
      description: 'Advanced course focusing on urgent treatment of cardiac arrest, stroke, and cardiovascular emergencies. Highly recommended for physicians, nurses, and paramedics.',
      trainer: 'Dr. Sarah Jenkins, MD, FACC',
      venue: 'Main Medical Center Hall A',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      participantLimit: 30,
      registeredCount: 0,
      status: 'open'
    });

    // Another Open Training
    TrainingDb.create({
      title: 'Community Health Awareness & Preventive Medicine',
      description: 'A campaign and training event focused on nutritional counseling, hygiene practices, and early indicators of chronic illnesses to promote longevity in municipal communities.',
      trainer: 'Clara Oswald, Lead Community Nurse',
      venue: 'Green Valley Community Center',
      startDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days from now
      endDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      participantLimit: 50,
      registeredCount: 0,
      status: 'open'
    });

    // A Full Training (for capacity demonstration)
    const fullTraining = TrainingDb.create({
      title: 'Pediatric First Aid & CPR Workshop',
      description: 'Essential lifesaving skills training for handling breathing emergencies, allergic reactions, choking, and cardiac arrest in infants and children.',
      trainer: 'Robert Downey, EMT-P',
      venue: 'Family Wellness Annex Room 4',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registrationDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      participantLimit: 2,
      registeredCount: 2,
      status: 'full'
    });

    // Seed registrations for the full training to match limits
    const users = UserDb.find({ role: 'user' });
    if (users.length >= 2) {
      RegistrationDb.create({
        user: users[0]._id,
        training: fullTraining._id,
        attendanceStatus: 'present',
        completionStatus: 'ongoing',
        registeredAt: new Date().toISOString()
      });
      RegistrationDb.create({
        user: users[1]._id,
        training: fullTraining._id,
        attendanceStatus: 'present',
        completionStatus: 'ongoing',
        registeredAt: new Date().toISOString()
      });
    }

    // A Closed Training (Completed in past)
    const pastTraining = TrainingDb.create({
      title: 'Infection Control and Prevention in Clinical Settings',
      description: 'Understanding pathogens, hygiene barriers, personal protective equipment (PPE) compliance, and disinfecting protocols in high-risk zones.',
      trainer: 'Dr. Helen Carter, PhD in Virology',
      venue: 'Surgical Building Training Hall',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
      endDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registrationDeadline: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      participantLimit: 25,
      registeredCount: 1,
      status: 'closed'
    });

    // Seed registrations and certificate for past training
    if (users.length > 0) {
      const pastReg = RegistrationDb.create({
        user: users[0]._id,
        training: pastTraining._id,
        attendanceStatus: 'present',
        completionStatus: 'completed',
        registeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Issue certificate
      CertificateDb.create({
        user: users[0]._id,
        training: pastTraining._id,
        certificateNumber: 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4),
        issuedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }

  // 3. Seed Activities
  if (ActivityDb.countDocuments() === 0) {
    console.log('Seeding default activities...');
    ActivityDb.create({
      title: 'Free Blood Pressure & Diabetes Screening Campaign',
      description: 'Organized a free community wellness camp at Green Valley Mall where our trainers and nurses screened over 350 residents for primary health issues, providing education on nutrition and diabetes prevention.',
      images: ['/assets/images/activity1.jpg'],
      videos: [],
      activityDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    ActivityDb.create({
      title: 'World Health Day Symposium 2026',
      description: 'Hosted our annual panel discussion centering around modern public health structures, mental health equity, and resilient healthcare facilities. Panelists included lead regional physicians.',
      images: ['/assets/images/activity2.jpg'],
      videos: [],
      activityDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }

  // 4. Seed News
  if (NewsDb.countDocuments() === 0) {
    console.log('Seeding default news...');
    NewsDb.create({
      title: 'Organization Accredited for Continuing Nursing Education (CNE)',
      content: 'We are thrilled to announce that our training programs have officially been accredited by the Health Professions Council to award Continuing Nursing Education (CNE) units. This credential applies to all ACLS, Pediatric, and Infection Control courses starting immediately, enabling clinical staff to earn credits for license renewals.'
    });

    NewsDb.create({
      title: 'Upcoming Summer Community Wellness Initiatives Launching Soon',
      content: 'Starting next month, our healthcare organization will launch five new community health programs across rural and semi-urban localities. These programs are designed to combat sedentary lifestyle diseases, offer free clinical guides, and train volunteer health aides. Registration for volunteers is opening this weekend.'
    });
  }

  console.log('Database verification complete.');
}
