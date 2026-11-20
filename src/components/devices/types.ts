export interface DeviceOwner {
  id: string;
  name: string | null;
}

export interface DeviceItem {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
  type: string;
  online: boolean;
  status: string;
  notes: string | null;
  owner: DeviceOwner | null;
}

export interface DeviceOwnerOption {
  id: string;
  name: string | null;
  email: string | null;
}

export interface DeviceFormData {
  name: string;
  ip: string;
  mac: string | null;
  type: string;
  ownerId: string | null;
  notes: string | null;
}

/** Props compartidas por la vista móvil y la de escritorio. */
export interface DeviceViewProps {
  devices: DeviceItem[];
  owners: DeviceOwnerOption[];
  isAdmin: boolean;
  pending: boolean;
  editingId: string | null;
  confirmingId: string | null;
  onCreate: () => void;
  onImportScan: () => void;
  onToggleEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onCancelEdit: () => void;
}
