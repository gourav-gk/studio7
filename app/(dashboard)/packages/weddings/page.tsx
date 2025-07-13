"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { getWeddingColumns } from "./columns";
import { WeddingPackage } from "./types";
import AddWeddingPackageModal from "./AddWeddingPackageModal";
import { WeddingPackageTable } from "./table";
import { Button } from "@/components/ui/button";

function WeddingPackagesPage() {
  const [packages, setPackages] = useState<WeddingPackage[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WeddingPackage | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "wedding-packages"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data()) as WeddingPackage[];
      setPackages(data);
    });
    return () => unsub();
  }, []);

  const handleSave = async (pkg: WeddingPackage) => {
    const id = pkg.id || `wedding-${Date.now()}`;
    await setDoc(doc(firestore, "wedding-packages", id), { ...pkg, id });
    setOpen(false);
    setSelected(null);
  };

  const handleEdit = useCallback((pkg: WeddingPackage) => {
    setSelected(pkg);
    setOpen(true);
  }, []);

  const columns = useMemo(() => getWeddingColumns(handleEdit), [handleEdit]);

  const table = useReactTable({
    data: packages,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wedding Packages</h2>
        <Button onClick={() => setOpen(true)}>Add Package</Button>
      </div>
      <WeddingPackageTable table={table} />
      <AddWeddingPackageModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        onSave={handleSave}
        initialData={selected}
      />
    </div>
  );
}

export default WeddingPackagesPage;
