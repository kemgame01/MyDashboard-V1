import React from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export default function CustomerControlsDisclosure({ children }) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded font-medium hover:bg-gray-300 transition"
            aria-label="Toggle customer controls"
          >
            <span>Customer Controls</span>
            <ChevronDown
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              size={18}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="p-4 border rounded bg-white mt-2 shadow">
            {children}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
