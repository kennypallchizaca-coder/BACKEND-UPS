import React, { useEffect, useState } from 'react';
import { Box, Flex, Typography, Loader } from '@strapi/design-system';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Summary {
  publicationsCount: number;
  leadsCount: number;
  companiesCount: number;
  emailsCount: number;
  failedEmailsCount: number;
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

// ── Paleta de colores Strapi ──────────────────────────────────────────────────

const PALETTE = {
  leads:        '#7B79FF',
  companies:    '#5CB176',
  publications: '#F0BC00',
  emailsSent:   '#66B7F1',
  emailsFailed: '#EE5E52',
};

// ── Iconos SVG profesionales ──────────────────────────────────────────────────

const IconUser = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBuilding = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 22V12h6v10" />
    <path d="M9 7h1" /><path d="M14 7h1" />
    <path d="M9 11h1" /><path d="M14 11h1" />
  </svg>
);

const IconFile = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconMail = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconAlertCircle = ({ color }: { color: string }) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ── Diagrama de pastel SVG ────────────────────────────────────────────────────

function PieChart({ slices }: { slices: PieSlice[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Flex justifyContent="center" padding={8}>
        <Typography variant="omega" textColor="neutral500">Sin datos aún</Typography>
      </Flex>
    );
  }

  const CX = 130;
  const CY = 130;
  const R  = 110;
  let   angle = -Math.PI / 2;

  const paths = slices.map((slice) => {
    const portion = slice.value / total;
    const startA  = angle;
    const endA    = angle + portion * 2 * Math.PI;
    angle         = endA;

    const x1    = CX + R * Math.cos(startA);
    const y1    = CY + R * Math.sin(startA);
    const x2    = CX + R * Math.cos(endA);
    const y2    = CY + R * Math.sin(endA);
    const large = endA - startA > Math.PI ? 1 : 0;
    const midA  = (startA + endA) / 2;
    const lx    = CX + R * 0.65 * Math.cos(midA);
    const ly    = CY + R * 0.65 * Math.sin(midA);
    const pct   = Math.round(portion * 100);

    return {
      d: `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      color: slice.color,
      label: slice.label,
      value: slice.value,
      pct, lx, ly,
    };
  });

  return (
    <Flex gap={8} wrap="wrap" alignItems="center">
      <svg width={260} height={260} viewBox="0 0 260 260" style={{ flexShrink: 0 }}>
        {paths.map((p, i) => (
          <g key={i}>
            <path d={p.d} fill={p.color} stroke="white" strokeWidth={3}>
              <title>{p.label}: {p.value} ({p.pct}%)</title>
            </path>
            {p.pct >= 7 && (
              <text
                x={p.lx} y={p.ly}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={13} fontWeight="700" fill="white"
              >
                {p.pct}%
              </text>
            )}
          </g>
        ))}
      </svg>

      <Flex direction="column" gap={3}>
        {paths.map((p, i) => (
          <Flex key={i} alignItems="center" gap={2}>
            <Box style={{ width: 12, height: 12, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <Typography variant="omega" textColor="neutral700">
              <strong>{p.value}</strong> {p.label}{' '}
              <span style={{ color: '#8e8ea9' }}>({p.pct}%)</span>
            </Typography>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

// ── Tarjeta de métrica ────────────────────────────────────────────────────────

function StatCard({ label, value, color, Icon, subtitle }: {
  label: string;
  value: number;
  color: string;
  Icon: React.ComponentType<{ color: string }>;
  subtitle?: string;
}) {
  return (
    <Box
      background="neutral0"
      hasRadius
      shadow="filterShadow"
      padding={5}
      style={{ minWidth: 185, borderTop: `3px solid ${color}` }}
    >
      <Flex alignItems="center" gap={3}>
        <Box style={{
          width: 44, height: 44, borderRadius: 10,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon color={color} />
        </Box>
        <Box>
          <Typography variant="alpha" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="pi" textColor="neutral600" style={{ display: 'block', marginTop: 4 }}>
            {label}
          </Typography>
          {subtitle && (
            <Typography variant="sigma" textColor="neutral400" style={{ fontSize: 11 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

// ── Sección contenedora ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box background="neutral0" hasRadius shadow="filterShadow" padding={6}>
      <Typography variant="delta" style={{ marginBottom: 24, display: 'block' }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const Metricas = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setSummary(data))
      .catch((err) => setError(`No se pudo cargar el resumen: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  const slices: PieSlice[] = summary
    ? [
        { label: 'Interesados',   value: summary.leadsCount,        color: PALETTE.leads        },
        { label: 'Empresas',      value: summary.companiesCount,     color: PALETTE.companies    },
        { label: 'Publicaciones', value: summary.publicationsCount,  color: PALETTE.publications },
        { label: 'Correos OK',    value: summary.emailsCount,        color: PALETTE.emailsSent   },
        { label: 'Correos Fail',  value: summary.failedEmailsCount,  color: PALETTE.emailsFailed },
      ].filter((s) => s.value > 0)
    : [];

  return (
    <Box padding={8} background="neutral100" style={{ minHeight: '100vh' }}>

      {/* Encabezado */}
      <Box paddingBottom={6}>
        <Typography variant="alpha">Métricas</Typography>
        <Typography variant="epsilon" textColor="neutral500" style={{ display: 'block', marginTop: 4 }}>
          Resumen general del sistema en tiempo real
        </Typography>
      </Box>

      {/* Carga */}
      {loading && (
        <Flex justifyContent="center" alignItems="center" gap={3} padding={10}>
          <Loader />
          <Typography variant="omega" textColor="neutral500">Cargando métricas…</Typography>
        </Flex>
      )}

      {/* Error */}
      {error && !loading && (
        <Box background="danger100" hasRadius padding={5} style={{ borderLeft: '4px solid #EE5E52' }}>
          <Typography variant="omega" textColor="danger600">{error}</Typography>
        </Box>
      )}

      {/* Contenido */}
      {summary && (
        <Flex direction="column" gap={6}>

          {/* Tarjetas */}
          <Flex gap={4} wrap="wrap">
            <StatCard label="Interesados"      value={summary.leadsCount}        color={PALETTE.leads}        Icon={IconUser}        subtitle="Solicitudes recibidas"      />
            <StatCard label="Empresas"         value={summary.companiesCount}    color={PALETTE.companies}    Icon={IconBuilding}    subtitle="Solicitudes de vinculación" />
            <StatCard label="Publicaciones"    value={summary.publicationsCount} color={PALETTE.publications} Icon={IconFile}        subtitle="Publicaciones académicas"   />
            <StatCard label="Correos Enviados" value={summary.emailsCount}       color={PALETTE.emailsSent}   Icon={IconMail}        subtitle="Enviados correctamente"     />
            <StatCard label="Correos Fallidos" value={summary.failedEmailsCount} color={PALETTE.emailsFailed} Icon={IconAlertCircle} subtitle="Con error de envío"         />
          </Flex>

          {/* Pastel */}
          <Section title="Distribución General">
            <PieChart slices={slices} />
          </Section>

        </Flex>
      )}
    </Box>
  );
};

export default Metricas;
