import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight, faPhone, faEnvelope, faMapMarkerAlt, faCalendarAlt,
  faUsers, faWallet, faExclamationTriangle, faUser, faInfoCircle,
  faUserGraduate, faLayerGroup, faChalkboardTeacher, faClock,
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { studentsService } from '@/services/students';
import { unwrap, unwrapList } from '@/services/api';
import { formatMoney, formatDate } from '@/utils/format';

// ─── Config ─────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Faol',           color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  frozen:    { label: 'Muzlatilgan',    color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  graduated: { label: 'Bitirgan',       color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  dropped:   { label: 'Chiqib ketgan',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  archived:  { label: 'Arxivlangan',    color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  inactive:  { label: 'Nofaol',         color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

// ─── Avatar ──────────────────────────────────────────────────
function Avatar({ name = '', size = 40 }) {
  const parts = name.trim().split(' ').filter(Boolean);
  const initials = parts.slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 40;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${20 + hue} 85% 55%), hsl(${10 + hue} 85% 45%))`,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.34, letterSpacing: 0.5,
    }}>{initials || '?'}</div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────
function Tabs({ tabs, value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 0,
      borderBottom: '1px solid var(--border-color)',
      overflowX: 'auto',
    }}>
      {tabs.map(t => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{
              padding: '10px 16px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${active ? 'var(--primary-600)' : 'transparent'}`,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: active ? 600 : 500,
              cursor: 'pointer', marginBottom: -1,
              transition: 'color 180ms, border-color 180ms',
              whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {t.label}
            {t.count != null && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999,
                background: active ? 'rgba(249,115,22,0.12)' : 'var(--bg-tertiary)',
                color: active ? 'var(--primary-600)' : 'var(--text-muted)',
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────
function ProfileTab({ student }) {
  const fields = [
    { icon: faPhone,      label: 'Telefon',         value: student.phone },
    { icon: faEnvelope,   label: 'Email',            value: student.email },
    { icon: faCalendarAlt,label: "Tug'ilgan sana",   value: student.birth_date ? formatDate(student.birth_date) : null },
    { icon: faUser,       label: 'Jinsi',            value: student.gender === 'male' ? 'Erkak' : student.gender === 'female' ? 'Ayol' : null },
    { icon: faMapMarkerAlt,label: 'Manzil',          value: student.address },
    { icon: faTelegram,   label: 'Telegram',         value: student.telegram_username ? `@${student.telegram_username}` : null },
  ].filter(f => f.value);

  const parentFields = [
    { icon: faUser,  label: 'Ota-ona ismi',    value: student.parent_name },
    { icon: faPhone, label: 'Ota-ona telefoni', value: student.parent_phone },
  ].filter(f => f.value);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      <div className="card" style={{ padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 16 }}>
          Shaxsiy ma'lumotlar
        </p>
        {fields.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fields.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={f.icon} style={{ width: 13, height: 13 }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            Ma'lumot kiritilmagan
          </p>
        )}
      </div>

      {parentFields.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 16 }}>
            Ota-ona ma'lumotlari
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {parentFields.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesomeIcon icon={f.icon} style={{ width: 13, height: 13 }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' }}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {student.notes && (
        <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 10 }}>
            Izoh
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{student.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── GroupsTab ────────────────────────────────────────────────
function GroupsTab({ groups, navigate }) {
  if (groups.length === 0) {
    return (
      <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 180 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faLayerGroup} style={{ width: 20 }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Guruhlar yo'q</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bu o'quvchi hech qaysi guruhga qo'shilmagan</p>
      </div>
    );
  }

  const dayNames = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {groups.map(g => (
        <div
          key={g.id}
          className="card"
          onClick={() => navigate(`/app/groups/${g.id}`)}
          style={{
            padding: 16, cursor: 'pointer',
            borderLeft: '4px solid var(--primary-600)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{g.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
              background: g.status === 'active' ? 'rgba(34,197,94,0.12)' : 'var(--bg-tertiary)',
              color: g.status === 'active' ? '#22C55E' : 'var(--text-muted)',
            }}>
              {g.status === 'active' ? 'Faol' : g.status}
            </span>
          </div>
          {g.course_name && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{g.course_name}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {g.teacher_name && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FontAwesomeIcon icon={faChalkboardTeacher} style={{ width: 11 }} />
                {g.teacher_name}
              </span>
            )}
            {(g.start_time || g.end_time) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FontAwesomeIcon icon={faClock} style={{ width: 11 }} />
                {g.start_time?.slice(0, 5)}–{g.end_time?.slice(0, 5)}
              </span>
            )}
            {g.days?.length > 0 && (
              <span style={{ color: 'var(--text-muted)' }}>
                {g.days.map(d => dayNames[d]).join(', ')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PlaceholderTab ───────────────────────────────────────────
function PlaceholderTab({ label }) {
  return (
    <div className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minHeight: 200, justifyContent: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesomeIcon icon={faInfoCircle} style={{ width: 22, height: 22 }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label} — keyingi versiyada</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tez orada qo'shiladi</p>
    </div>
  );
}

// ─── FinanceTab ───────────────────────────────────────────────
function FinanceTab({ student, onGoFull }) {
  const balance = Number(student?.balance) || 0;
  const isNegative = balance < 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Balance hero */}
      <div className="card" style={{
        padding: 24,
        borderLeft: `4px solid ${isNegative ? '#EF4444' : 'var(--primary-600)'}`,
        background: isNegative
          ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, var(--bg-secondary) 100%)'
          : 'linear-gradient(135deg, rgba(249,115,22,0.04) 0%, var(--bg-secondary) 100%)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 10 }}>
          Joriy balans
        </p>
        <p style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.1, color: isNegative ? '#EF4444' : '#1B365D', marginBottom: 8 }}>
          {isNegative ? '−' : ''}{formatMoney(Math.abs(balance))}
        </p>
        {isNegative && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#EF4444', marginBottom: 16 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ width: 12 }} />
            <span>Qarzdorlik mavjud</span>
          </div>
        )}
        <button
          onClick={onGoFull}
          style={{
            height: 38, padding: '0 18px',
            background: 'var(--primary-gradient, linear-gradient(135deg, #F97316, #EA580C))',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            boxShadow: 'var(--primary-shadow)',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--primary-shadow-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--primary-shadow)'; }}
        >
          <FontAwesomeIcon icon={faWallet} style={{ width: 14 }} />
          To'liq moliya sahifasi
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 8 }}>Ro'yxatga olingan</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {student.created_at ? formatDate(student.created_at) : '—'}
          </p>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 8 }}>Guruhlar soni</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {student.groups_count ?? '—'} ta
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [studentRes, groupsRes] = await Promise.allSettled([
        studentsService.getById(id),
        studentsService.getGroups(id),
      ]);
      if (studentRes.status === 'fulfilled') {
        setStudent(unwrap(studentRes.value));
      }
      if (groupsRes.status === 'fulfilled') {
        setGroups(unwrapList(groupsRes.value));
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(249,115,22,0.2)', borderTopColor: '#F97316',
          animation: 'spin 600ms linear infinite',
        }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faUserGraduate} style={{ width: 20 }} />
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>O'quvchi topilmadi</p>
        <button
          onClick={() => navigate('/app/students')}
          style={{ color: 'var(--primary-600)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
        >
          Ro'yxatga qaytish
        </button>
      </div>
    );
  }

  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const status = STATUS_CFG[student.status] || STATUS_CFG.active;
  const balance = Number(student.balance) || 0;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <button
          onClick={() => navigate('/app/students')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 12 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-600)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          O'quvchilar
        </button>
        <FontAwesomeIcon icon={faChevronRight} style={{ width: 10, height: 10 }} />
        <span style={{ color: 'var(--text-primary)' }}>{fullName}</span>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <Avatar name={fullName} size={64} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1B365D', letterSpacing: -0.4, margin: 0 }}>
                {fullName}
              </h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: status.bg, color: status.color,
                padding: '3px 10px', borderRadius: 999,
                fontSize: 11, fontWeight: 600,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.color }} />
                {status.label}
              </span>
              {balance < 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'rgba(239,68,68,0.12)', color: '#EF4444',
                  padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ width: 10 }} />
                  Qarzdor: {formatMoney(Math.abs(balance))}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {student.phone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <FontAwesomeIcon icon={faPhone} style={{ width: 12 }} />
                  {student.phone}
                </span>
              )}
              {groups.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <FontAwesomeIcon icon={faUsers} style={{ width: 12 }} />
                  {groups.length} ta guruh
                </span>
              )}
              {student.created_at && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ width: 12 }} />
                  {formatDate(student.created_at)}
                </span>
              )}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/app/students/${id}/finance`)}
              style={{
                height: 38, padding: '0 16px', borderRadius: 10,
                background: 'var(--primary-gradient, linear-gradient(135deg, #F97316, #EA580C))',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: 'var(--primary-shadow, 0 4px 14px rgba(249,115,22,0.3))',
                transition: 'all 180ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--primary-shadow-hover, 0 6px 20px rgba(249,115,22,0.4))'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--primary-shadow, 0 4px 14px rgba(249,115,22,0.3))'; }}
            >
              <FontAwesomeIcon icon={faWallet} style={{ width: 14 }} />
              Moliya
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'profile',    label: 'Profil' },
          { value: 'groups',     label: 'Guruhlar', count: groups.length || null },
          { value: 'finance',    label: 'Moliya' },
          { value: 'attendance', label: 'Davomat' },
          { value: 'notes',      label: 'Izohlar' },
        ]}
      />

      {/* Tab content */}
      {tab === 'profile'    && <ProfileTab student={student} />}
      {tab === 'groups'     && <GroupsTab groups={groups} navigate={navigate} />}
      {tab === 'finance'    && <FinanceTab student={student} onGoFull={() => navigate(`/app/students/${id}/finance`)} />}
      {tab === 'attendance' && <PlaceholderTab label="Davomat" />}
      {tab === 'notes'      && <PlaceholderTab label="Izohlar" />}
    </div>
  );
}
