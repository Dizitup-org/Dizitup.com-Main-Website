// src/utils/seedAdmin.js
// ============================================================
// AUTO-SEED ADMIN ACCOUNT ON SERVER STARTUP
// ============================================================
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env.
// On every server start it ensures:
//   1. A user with that email exists in the users table
//   2. That user has a row in the admins table
// This means the admin can always log in via the normal
// POST /api/auth/login endpoint using those credentials.
// ============================================================

const bcrypt = require('bcryptjs');
const db     = require('../db');

// ============================================================
// SCHEMA INITIALIZATION — runs before seeding
// Creates all tables on a fresh Neon DB, safe to re-run
// ============================================================
const initializeSchema = async () => {
  console.log('🔧 Initializing database schema...');
  try {
    // 1. users (base table — no foreign key deps)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        username              VARCHAR(50)  NOT NULL UNIQUE,
        email                 VARCHAR(255) NOT NULL UNIQUE,
        password_hash         TEXT         NOT NULL,
        first_name            VARCHAR(100) NOT NULL,
        last_name             VARCHAR(100) NOT NULL,
        phone                 VARCHAR(20),
        business_name         VARCHAR(150),
        username_change_count INT          NOT NULL DEFAULT 0,
        profile_picture       TEXT,
        created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`).catch(() => {});

    // 2. admins (depends on users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        role    VARCHAR(50) NOT NULL DEFAULT 'admin'
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id)`).catch(() => {});

    // 3. bookings (depends on users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID        REFERENCES users(id) ON DELETE RESTRICT,
        project_type     VARCHAR(100),
        notes            TEXT,
        meeting_datetime TIMESTAMPTZ,
        status           VARCHAR(20) NOT NULL DEFAULT 'pending',
        name             VARCHAR(150),
        meeting_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
        meeting_time     TIME        NOT NULL DEFAULT CURRENT_TIME,
        email            TEXT,
        agency           TEXT,
        updated_at       TIMESTAMP   DEFAULT NOW(),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_status           ON bookings(status)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_meeting_datetime ON bookings(meeting_datetime)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_user_id          ON bookings(user_id)`).catch(() => {});

    // 4. query_clients (depends on bookings, users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS query_clients (
        id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id     UUID         NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        user_id        UUID         REFERENCES users(id),
        status         VARCHAR(30)  NOT NULL DEFAULT 'open',
        notes          TEXT,
        follow_up_date TIMESTAMPTZ,
        name           VARCHAR(150),
        email          VARCHAR(255),
        phone          VARCHAR(20),
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_query_clients_booking_id ON query_clients(booking_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_query_clients_status     ON query_clients(status)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_query_clients_user_id    ON query_clients(user_id)`).catch(() => {});

    // 5. onboard_clients (depends on bookings, users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS onboard_clients (
        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID         NOT NULL REFERENCES users(id),
        booking_id   UUID         NOT NULL UNIQUE REFERENCES bookings(id),
        company_name VARCHAR(150),
        contact_name VARCHAR(150) NOT NULL,
        email        VARCHAR(255) NOT NULL,
        phone        VARCHAR(20),
        onboarded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        status       VARCHAR(20)  NOT NULL DEFAULT 'active',
        username     VARCHAR(100),
        avatar_url   TEXT,
        start_date   DATE,
        admin_notes  TEXT,
        feedback     TEXT
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_onboard_clients_booking_id ON onboard_clients(booking_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_onboard_clients_status     ON onboard_clients(status)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_onboard_clients_user_id    ON onboard_clients(user_id)`).catch(() => {});

    // 6. portfolio (independent)
    await db.query(`
      CREATE TABLE IF NOT EXISTS portfolio (
        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        title        VARCHAR(200) NOT NULL,
        description  TEXT,
        category     VARCHAR(100),
        image_url    TEXT,
        project_url  TEXT,
        tech_stack   TEXT[],
        completed_at DATE,
        is_featured  BOOLEAN      NOT NULL DEFAULT false,
        link         TEXT,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio(category)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_portfolio_featured  ON portfolio(is_featured)`).catch(() => {});

    // 7. subscriptions (depends on users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan         VARCHAR(50) NOT NULL DEFAULT 'free',
        status       VARCHAR(20) NOT NULL DEFAULT 'active',
        renewal_date DATE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`).catch(() => {});

    // 8. projects (depends on onboard_clients)
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id    UUID          REFERENCES onboard_clients(id) ON DELETE RESTRICT,
        title        VARCHAR(200),
        description  TEXT,
        status       VARCHAR(30)   NOT NULL DEFAULT 'active',
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        expenses     NUMERIC(12,2) NOT NULL DEFAULT 0,
        start_date   DATE,
        end_date     DATE,
        deadline     DATE,
        client_name  TEXT,
        project_name TEXT,
        created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects(status)`).catch(() => {});

    // 9. project_updates (depends on projects, admins)
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_updates (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        message     TEXT        NOT NULL,
        employee_id UUID        REFERENCES admins(id) ON DELETE SET NULL,
        author_role TEXT        NOT NULL DEFAULT 'admin',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 10. project_assignments (depends on projects, admins)
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_assignments (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        employee_id UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        assigned_by UUID        NOT NULL REFERENCES admins(id),
        status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','removed')),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_pa_project  ON project_assignments(project_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_pa_employee ON project_assignments(employee_id)`).catch(() => {});

    // 11. tasks (depends on projects, admins)
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id    UUID        REFERENCES projects(id) ON DELETE CASCADE,
        title         TEXT        NOT NULL,
        description   TEXT,
        employee_id   UUID        REFERENCES admins(id) ON DELETE SET NULL,
        assigned_by   UUID        REFERENCES admins(id),
        status        VARCHAR(50) NOT NULL DEFAULT 'pending',
        deadline      DATE,
        manager_notes TEXT,
        updated_at    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_project  ON tasks(project_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employee_id)`).catch(() => {});

    // 12. task_notes (depends on tasks, users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_notes (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id       UUID         REFERENCES tasks(id) ON DELETE CASCADE,
        employee_id   UUID         REFERENCES users(id),
        employee_name VARCHAR(255),
        note          TEXT         NOT NULL,
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // 13. sales (depends on projects)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id     UUID          NOT NULL REFERENCES projects(id),
        paid_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
        sale_date      DATE          NOT NULL DEFAULT CURRENT_DATE,
        notes          TEXT,
        pending_amount NUMERIC(12,2) DEFAULT 0,
        expenses       NUMERIC(12,2) DEFAULT 0,
        amount         NUMERIC(12,2) DEFAULT 0,
        payment_method VARCHAR(50),
        client_name    TEXT,
        service        TEXT,
        type           TEXT,
        status         TEXT,
        created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_project_id   ON sales(project_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_payment_date ON sales(sale_date)`).catch(() => {});

    // 14. chat_conversations (depends on users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status          VARCHAR(20) DEFAULT 'open',
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id)`).catch(() => {});

    // 15. chat_messages (depends on chat_conversations)
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID        NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender_type     VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
        sender_id       UUID,
        message         TEXT        NOT NULL,
        is_read         BOOLEAN     DEFAULT FALSE,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id, created_at)`).catch(() => {});

    // 16. team_messages (independent)
    await db.query(`
      CREATE TABLE IF NOT EXISTS team_messages (
        id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        channel     VARCHAR(200) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_id   UUID,
        message     TEXT         NOT NULL,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_team_msg_channel ON team_messages(channel, created_at)`).catch(() => {});

    // 17. visitor_leads (independent)
    await db.query(`
      CREATE TABLE IF NOT EXISTS visitor_leads (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT,
        agency_size TEXT,
        country     TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // ---- ALTER TABLE statements (idempotent) ----
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id)`).catch(() => {});
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`).catch(() => {});

    // 18. sales_leads (independent — managed by sales team)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_leads (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        added_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
        region        VARCHAR(20)  NOT NULL DEFAULT 'india' CHECK (region IN ('india','foreign')),
        name          VARCHAR(200) NOT NULL,
        email         VARCHAR(255),
        phone         VARCHAR(30),
        company       VARCHAR(200),
        status        VARCHAR(30)  NOT NULL DEFAULT 'cold' CHECK (status IN ('cold','followup','onboarded','dropped')),
        followup_date TIMESTAMPTZ,
        notes         TEXT,
        converted     BOOLEAN      NOT NULL DEFAULT false,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_leads_region ON sales_leads(region)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status)`).catch(() => {});

    // 19. sales_documents (admin uploads visible to sales team)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_documents (
        id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        title              VARCHAR(300) NOT NULL,
        file_url           TEXT         NOT NULL,
        uploaded_by_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
        created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    // 20. sales_messages (sales team channel chat)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_messages (
        id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
        sender_name VARCHAR(255) NOT NULL,
        message     TEXT         NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_sales_messages_created ON sales_messages(created_at)`).catch(() => {});

    console.log('\u2705 Schema initialization complete.');
  } catch (err) {
    console.error('❌ Schema initialization failed:', err.message);
    throw err; // abort startup if core schema fails
  }
};

const seedAdmin = async () => {
  // Ensure all tables exist before any INSERT/SELECT
  await initializeSchema();
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.');
    return;
  }

  try {
    // 1. Find or create the user
    let userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    let userId;

    if (userResult.rows.length === 0) {
      // User doesn't exist — create them
      const hash = await bcrypt.hash(password, 12);
      const inserted = await db.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['admin', email.toLowerCase().trim(), hash, 'Admin', 'User']
      );
      userId = inserted.rows[0].id;
      console.log('✅ Admin user created:', email);
    } else {
      userId = userResult.rows[0].id;

      // Update password hash in case ADMIN_PASSWORD changed
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hash, userId]
      );
    }

    // 2. Ensure user is in the admins table
    const adminCheck = await db.query(
      'SELECT id FROM admins WHERE user_id = $1',
      [userId]
    );

    if (adminCheck.rows.length === 0) {
      await db.query(
        `INSERT INTO admins (user_id, role) VALUES ($1, $2)`,
        [userId, 'superadmin']
      );
      console.log('✅ Admin role granted to:', email);
    }

    console.log('✅ Admin account ready — login with ADMIN_EMAIL from .env');

  } catch (err) {
    console.error('❌ Admin seed failed:', err.message);
  }

  // ----------------------------------------------------------
  // ADDITIONAL STAFF ACCOUNTS
  // ----------------------------------------------------------
  const staffAccounts = [
    { email: 'roybrothers@gmail.com',  password: 'crores123',  first_name: 'Roy',    last_name: 'Brothers', username: 'roybrothers', role: 'admin'    },
    { email: 'atanu@dizitup.com',      password: 'atanu123',   first_name: 'Atanu',  last_name: 'Roy',      username: 'atanu',      role: 'admin'    },
    { email: 'piyush@dizitup.com',     password: 'piyush123',  first_name: 'Piyush', last_name: 'Paul',     username: 'piyush',     role: 'manager'  },
    { email: 'diziteam@dizitup.com',   password: 'team123',    first_name: 'Dizi',   last_name: 'Team',     username: 'diziteam',   role: 'employee' },
  ];

  for (const staff of staffAccounts) {
    try {
      // Check if user already exists
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [staff.email]
      );

      let staffUserId;

      if (existing.rows.length > 0) {
        // User exists — ensure last_name is up to date
        staffUserId = existing.rows[0].id;
        await db.query(
          'UPDATE users SET last_name = $1 WHERE id = $2',
          [staff.last_name, staffUserId]
        );
      } else {
        // Create user
        const hash = await bcrypt.hash(staff.password, 12);
        const inserted = await db.query(
          `INSERT INTO users (username, email, password_hash, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [staff.username, staff.email, hash, staff.first_name, staff.last_name]
        );
        staffUserId = inserted.rows[0].id;
        console.log(`✅ Staff user created: ${staff.email} (${staff.role})`);
      }

      // Ensure admin row exists
      const adminRow = await db.query(
        'SELECT id FROM admins WHERE user_id = $1',
        [staffUserId]
      );

      if (adminRow.rows.length === 0) {
        await db.query(
          `INSERT INTO admins (user_id, role) VALUES ($1, $2)`,
          [staffUserId, staff.role]
        );
        console.log(`✅ Role '${staff.role}' granted to: ${staff.email}`);
      }
    } catch (err) {
      console.error(`❌ Staff seed failed for ${staff.email}:`, err.message);
    }
  }
};

module.exports = seedAdmin;
