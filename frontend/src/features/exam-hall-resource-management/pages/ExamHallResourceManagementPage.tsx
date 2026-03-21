import { FormEvent, useEffect, useState } from "react";
import {
  archiveHall,
  createHall,
  createHallBooking,
  listHallBookings,
  listHalls,
  upsertHallFacility,
} from "../api/examHallApi";
import type { HallBooking, HallWithFacility } from "../types/models";

export function ExamHallResourceManagementPage() {
  const [halls, setHalls] = useState<HallWithFacility[]>([]);
  const [bookings, setBookings] = useState<HallBooking[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(50);

  const [facilityHallId, setFacilityHallId] = useState("");
  const [hasAc, setHasAc] = useState(false);
  const [hasComputers, setHasComputers] = useState(false);
  const [hasAccessibilitySupport, setHasAccessibilitySupport] = useState(false);
  const [hasSpecialNeedsSupport, setHasSpecialNeedsSupport] = useState(false);

  const [bookingHallId, setBookingHallId] = useState("");
  const [examSessionId, setExamSessionId] = useState("");

  async function loadData() {
    try {
      setErrorMessage("");
      const [hallsData, bookingsData] = await Promise.all([listHalls(), listHallBookings()]);
      setHalls(hallsData);
      setBookings(bookingsData);

      if (!facilityHallId && hallsData.length) {
        setFacilityHallId(hallsData[0].id);
      }
      if (!bookingHallId && hallsData.length) {
        setBookingHallId(hallsData[0].id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load halls/bookings");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onCreateHall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      if (code.trim().length < 2 || code.trim().length > 20) {
        setErrorMessage("Hall code must be between 2 and 20 characters.");
        return;
      }
      if (name.trim().length < 3) {
        setErrorMessage("Hall name must be at least 3 characters.");
        return;
      }
      if (location.trim().length < 3) {
        setErrorMessage("Location must be at least 3 characters.");
        return;
      }
      if (capacity < 1 || capacity > 5000) {
        setErrorMessage("Capacity must be between 1 and 5000.");
        return;
      }

      await createHall({ code: code.trim(), name: name.trim(), location: location.trim(), capacity });
      setCode("");
      setName("");
      setLocation("");
      setCapacity(50);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create hall");
    }
  }

  async function onUpdateFacility(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      if (!facilityHallId) {
        setErrorMessage("Select a hall before updating facilities.");
        return;
      }
      await upsertHallFacility(facilityHallId, {
        hasAc,
        hasComputers,
        hasAccessibilitySupport,
        hasSpecialNeedsSupport,
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update facility");
    }
  }

  async function onCreateBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setErrorMessage("");
      if (!bookingHallId) {
        setErrorMessage("Select a hall for booking.");
        return;
      }
      if (examSessionId.trim().length < 8) {
        setErrorMessage("Exam Session ID must be at least 8 characters.");
        return;
      }

      await createHallBooking({ hallId: bookingHallId, examSessionId: examSessionId.trim() });
      setExamSessionId("");
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create booking");
    }
  }

  async function onArchiveHall(hallId: string) {
    try {
      setErrorMessage("");
      await archiveHall(hallId);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to archive hall");
    }
  }

  return (
    <main>
      <section className="page-header">
        <h1>Exam Hall &amp; Resource Management</h1>
        <p>Manage hall inventory, facilities, and booking allocations with clash prevention.</p>
      </section>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <section className="card">
        <h2>Create Hall</h2>
        <form onSubmit={onCreateHall} className="form-grid">
          <input className="app-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Code" required />
          <input className="app-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
          <input className="app-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" required />
          <input
            className="app-input"
            type="number"
            value={capacity}
            min={1}
            onChange={(event) => setCapacity(Number(event.target.value))}
            placeholder="Capacity"
            required
          />
          <button className="app-button" type="submit">Add Hall</button>
        </form>
      </section>

      <section className="card">
        <h2>Update Hall Facilities</h2>
        <form onSubmit={onUpdateFacility} className="form-grid">
          <select className="app-select" value={facilityHallId} onChange={(event) => setFacilityHallId(event.target.value)} required>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.code} - {hall.name}
              </option>
            ))}
          </select>
          <label className="inline-row">
            <input type="checkbox" checked={hasAc} onChange={(event) => setHasAc(event.target.checked)} /> Has AC
          </label>
          <label className="inline-row">
            <input
              type="checkbox"
              checked={hasComputers}
              onChange={(event) => setHasComputers(event.target.checked)}
            /> Has Computers
          </label>
          <label className="inline-row">
            <input
              type="checkbox"
              checked={hasAccessibilitySupport}
              onChange={(event) => setHasAccessibilitySupport(event.target.checked)}
            /> Accessibility Support
          </label>
          <label className="inline-row">
            <input
              type="checkbox"
              checked={hasSpecialNeedsSupport}
              onChange={(event) => setHasSpecialNeedsSupport(event.target.checked)}
            /> Special Needs Support
          </label>
          <button className="app-button" type="submit">Save Facilities</button>
        </form>
      </section>

      <section className="card">
        <h2>Create Hall Booking</h2>
        <form onSubmit={onCreateBooking} className="form-grid">
          <select className="app-select" value={bookingHallId} onChange={(event) => setBookingHallId(event.target.value)} required>
            {halls.filter((hall) => hall.status === "active").map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.code} - {hall.name}
              </option>
            ))}
          </select>
          <input
            className="app-input"
            value={examSessionId}
            onChange={(event) => setExamSessionId(event.target.value)}
            placeholder="Exam Session ID"
            required
          />
          <button className="app-button" type="submit">Book Hall</button>
        </form>
      </section>

      <section className="card">
        <h2>Halls</h2>
        {!halls.length ? (
          <p>No halls yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Code</th>
                <th align="left">Name</th>
                <th align="left">Location</th>
                <th align="left">Capacity</th>
                <th align="left">Status</th>
                <th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {halls.map((hall) => (
                <tr key={hall.id}>
                  <td>{hall.code}</td>
                  <td>{hall.name}</td>
                  <td>{hall.location}</td>
                  <td>{hall.capacity}</td>
                  <td>{hall.status}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onArchiveHall(hall.id)}
                      disabled={hall.status === "inactive"}
                      className="app-button"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Hall Bookings</h2>
        {!bookings.length ? (
          <p>No bookings yet.</p>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th align="left">Booking ID</th>
                <th align="left">Hall ID</th>
                <th align="left">Exam Session ID</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.hallId}</td>
                  <td>{booking.examSessionId}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
