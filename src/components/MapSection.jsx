import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Link } from 'react-router-dom'
import './MapSection.css'

// Coordonatele centrului Galați
const GALATI_CENTER = [45.4353, 28.0080]
const GALATI_ZOOM   = 14

// Markere mock — vor fi înlocuite cu date reale din Supabase în Faza 2
const MOCK_MARKERS = [
  { id: 1, lat: 45.4380, lng: 28.0150, title: 'Groapă Bd. Galați', category: 'Drumuri', status: 'in_progress', color: '#f59e0b' },
  { id: 2, lat: 45.4320, lng: 28.0050, title: 'Felinar defect Parcul Rizer', category: 'Iluminat', status: 'new', color: '#3b82f6' },
  { id: 3, lat: 45.4410, lng: 27.9980, title: 'Gunoi abandonat str. Brăilei', category: 'Salubritate', status: 'new', color: '#3b82f6' },
  { id: 4, lat: 45.4290, lng: 28.0200, title: 'Canalizare înfundată', category: 'Apă', status: 'resolved', color: '#10b981' },
  { id: 5, lat: 45.4450, lng: 28.0100, title: 'Stradă neiluminată Micro 39', category: 'Iluminat', status: 'in_progress', color: '#f59e0b' },
  { id: 6, lat: 45.4350, lng: 27.9900, title: 'Asfalt deteriorat str. Tecuci', category: 'Drumuri', status: 'resolved', color: '#10b981' },
  { id: 7, lat: 45.4270, lng: 28.0300, title: 'Copac căzut pe trotuar', category: 'Spații Verzi', status: 'new', color: '#3b82f6' },
  { id: 8, lat: 45.4490, lng: 28.0050, title: 'Groapă intersecție Traian', category: 'Drumuri', status: 'new', color: '#3b82f6' },
]

const STATUS_LABELS = {
  new:         'Nouă',
  in_progress: 'În lucru',
  resolved:    'Rezolvată',
}

// Creează un marker rotund colorat cu SVG — arată mult mai bine decât default Leaflet
function createIcon(color, status) {
  const pulse = status === 'new'
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:${color};opacity:0.25;animation:pulse 2s infinite"></div>`
    : ''

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:32px">
        ${pulse}
        <div style="
          width:32px;height:32px;
          background:${color};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
          position:relative;
        ">
          ${getCategoryEmoji(status)}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

function getCategoryEmoji(status) {
  if (status === 'resolved') return '✅'
  if (status === 'in_progress') return '🔧'
  return '📍'
}

// Componenta care forțează recalcularea hărții când se randează în container flex/grid
function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100)
  }, [map])
  return null
}

function MapSection() {
  return (
    <section className="map-section">
      <div className="map-section__header container">
        <div className="map-section__title-group">
          <span className="section__tag">Live pe hartă</span>
          <h2>Sesizările din Galați</h2>
          <p className="section__desc">Toate problemele raportate, vizibile în timp real pe harta orașului</p>
        </div>

        <div className="map-section__legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#3b82f6' }} />
            Sesizare nouă
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#f59e0b' }} />
            În lucru
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#10b981' }} />
            Rezolvată
          </div>
        </div>
      </div>

      <div className="map-section__body">
        {/* SIDEBAR */}
        <div className="map-sidebar">
          <div className="map-sidebar__search">
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Caută o sesizare..."
              style={{ borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
            />
          </div>

          <div className="map-sidebar__list">
            {MOCK_MARKERS.map(m => (
              <div key={m.id} className="sidebar-item">
                <div className="sidebar-item__dot" style={{ background: m.color }} />
                <div className="sidebar-item__body">
                  <p className="sidebar-item__title">{m.title}</p>
                  <span className="sidebar-item__cat">{m.category}</span>
                </div>
                <span className={`badge ${m.status === 'new' ? 'badge-new' : m.status === 'in_progress' ? 'badge-progress' : 'badge-resolved'}`}>
                  {STATUS_LABELS[m.status]}
                </span>
              </div>
            ))}
          </div>

          <div className="map-sidebar__footer">
            <Link to="/report/new" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              ➕ Adaugă sesizare
            </Link>
          </div>
        </div>

        {/* HARTA */}
        <div className="map-wrapper">
          <MapContainer
            center={GALATI_CENTER}
            zoom={GALATI_ZOOM}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <InvalidateSize />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {MOCK_MARKERS.map(m => (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={createIcon(m.color, m.status)}
              >
                <Popup className="custom-popup">
                  <div className="popup-content">
                    <strong>{m.title}</strong>
                    <span className="popup-cat">{m.category}</span>
                    <span className={`badge ${m.status === 'new' ? 'badge-new' : m.status === 'in_progress' ? 'badge-progress' : 'badge-resolved'}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                    <Link to={`/report/${m.id}`} className="popup-link">
                      Vezi detalii →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  )
}

export default MapSection
