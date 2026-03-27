require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────
//  CONFIGURE AS CREDENCIAIS DO ADMIN ABAIXO
// ─────────────────────────────────────────────
const ADMIN = {
  name: 'Administrador',
  email: 'admin@plataforma.com',
  password: 'Admin@123456',
};
// ─────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_platform';

async function seed() {
  console.log('\n🌱  Iniciando seed da plataforma...\n');

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('✅  MongoDB conectado:', mongoose.connection.host);

  // ── Schemas inline para evitar dependências circulares ──────────────────
  const userSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true },
      password: { type: String, select: false },
      role: { type: String, default: 'user' },
      level: { type: String, default: 'iniciante' },
      avatar: { type: String, default: null },
      isActive: { type: Boolean, default: true },
      isBanned: { type: Boolean, default: false },
      banReason: { type: String, default: null },
      lastLogin: { type: Date, default: null },
    },
    { timestamps: true }
  );
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  const categorySchema = new mongoose.Schema(
    {
      name: String,
      slug: { type: String, unique: true },
      description: String,
      icon: String,
      color: String,
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
  );

  const contentSchema = new mongoose.Schema(
    {
      title: String,
      description: String,
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      type: { type: String, default: 'material' },
      minLevel: { type: String, default: 'iniciante' },
      fileUrl: String,
      externalLink: String,
      tags: [String],
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isActive: { type: Boolean, default: true },
      isDrop: { type: Boolean, default: false },
      dropExpiresAt: Date,
    },
    { timestamps: true }
  );

  // Registra os models (evita OverwriteModelError)
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
  const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);

  // ── 1. Criar / atualizar Admin ──────────────────────────────────────────
  let adminUser = await User.findOne({ email: ADMIN.email }).select('+password');

  if (adminUser) {
    adminUser.name = ADMIN.name;
    adminUser.role = 'admin';
    adminUser.level = 'elite';
    adminUser.password = ADMIN.password; // será re-hashado pelo pre-save
    await adminUser.save();
    console.log(`🔄  Admin atualizado: ${ADMIN.email}`);
  } else {
    adminUser = await User.create({
      name: ADMIN.name,
      email: ADMIN.email,
      password: ADMIN.password,
      role: 'admin',
      level: 'elite',
    });
    console.log(`✅  Admin criado: ${ADMIN.email}`);
  }

  // ── 2. Categorias iniciais ──────────────────────────────────────────────
  const categorias = [
    { name: 'Programas', slug: 'programas', description: 'Softwares e ferramentas exclusivas', icon: 'monitor', color: '#22c55e', order: 1 },
    { name: 'Databases', slug: 'databases', description: 'Bases de dados e planilhas estratégicas', icon: 'database', color: '#3b82f6', order: 2 },
    { name: 'Materiais', slug: 'materiais', description: 'PDFs, guias e documentação', icon: 'file-text', color: '#f59e0b', order: 3 },
    { name: 'Esquemas', slug: 'esquemas', description: 'Mapas mentais e fluxogramas', icon: 'git-branch', color: '#8b5cf6', order: 4 },
    { name: 'Vídeos', slug: 'videos', description: 'Conteúdos em vídeo exclusivos', icon: 'video', color: '#ef4444', order: 5 },
  ];

  for (const cat of categorias) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { ...cat, createdBy: adminUser._id },
      { upsert: true, new: true }
    );
  }
  console.log(`✅  ${categorias.length} categorias criadas/atualizadas`);

  // ── 3. Conteúdos de exemplo ─────────────────────────────────────────────
  const catProgramas = await Category.findOne({ slug: 'programas' });
  const catMateriais = await Category.findOne({ slug: 'materiais' });
  const catDatabases = await Category.findOne({ slug: 'databases' });

  const conteudos = [
    {
      title: 'Guia de Boas-Vindas',
      description: 'Tudo que você precisa saber para começar na plataforma. Leia antes de qualquer coisa.',
      category: catMateriais._id,
      type: 'material',
      minLevel: 'iniciante',
      externalLink: 'https://example.com',
      tags: ['iniciante', 'guia', 'boas-vindas'],
      views: 120,
    },
    {
      title: 'Ferramenta Premium v2.0',
      description: 'Software exclusivo para membros. Inclui documentação e suporte.',
      category: catProgramas._id,
      type: 'programa',
      minLevel: 'intermediario',
      externalLink: 'https://example.com',
      tags: ['ferramenta', 'software'],
      views: 85,
      downloads: 42,
    },
    {
      title: 'Base de Dados Estratégica 2024',
      description: 'Database completa com mais de 10.000 registros. Atualizada mensalmente.',
      category: catDatabases._id,
      type: 'database',
      minLevel: 'avancado',
      externalLink: 'https://example.com',
      tags: ['database', 'estrategia', '2024'],
      views: 210,
      downloads: 67,
    },
    {
      title: '🔥 DROP — Método Elite Exclusivo',
      description: 'Conteúdo liberado por tempo limitado. Disponível apenas para membros elite.',
      category: catMateriais._id,
      type: 'esquema',
      minLevel: 'elite',
      externalLink: 'https://example.com',
      tags: ['elite', 'exclusivo', 'drop'],
      isDrop: true,
      dropExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      views: 33,
    },
  ];

  for (const c of conteudos) {
    const exists = await Content.findOne({ title: c.title });
    if (!exists) {
      await Content.create({ ...c, createdBy: adminUser._id });
    }
  }
  console.log(`✅  ${conteudos.length} conteúdos de exemplo criados`);

  // ── Resultado final ─────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  SEED CONCLUÍDO COM SUCESSO!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n  📧  Email:  ${ADMIN.email}`);
  console.log(`  🔑  Senha:  ${ADMIN.password}`);
  console.log(`  👑  Role:   admin / elite`);
  console.log('\n  ⚠️   Altere a senha após o primeiro login!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Erro no seed:', err.message);
  process.exit(1);
});
