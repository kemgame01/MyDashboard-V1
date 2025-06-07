import React from "react";
import InputField from "../../components/InputField";

const ProfileFields = ({ form, onChange, isLoading, editing, userId }) => {
  const getValue = (key) => (form && form[key] != null ? form[key] : "");

  return (
    <>
      <InputField
        label="Display Name"
        id="displayName"
        type="text"
        value={getValue("displayName")}
        onChange={onChange}
        name="displayName"
        autoComplete="nickname"
        disabled={isLoading || !editing}
      />
      <InputField
        label="Name"
        id="name"
        type="text"
        value={getValue("name")}
        onChange={onChange}
        name="name"
        autoComplete="name"
        disabled={isLoading || !editing}
      />
      <InputField
        label="Phone"
        id="phone"
        type="text"
        value={getValue("phone")}
        onChange={onChange}
        name="phone"
        autoComplete="tel"
        disabled={isLoading || !editing}
      />
      <InputField
        label="Address"
        id="address"
        type="text"
        value={getValue("address")}
        onChange={onChange}
        name="address"
        autoComplete="street-address"
        disabled={isLoading || !editing}
      />
      <InputField
        label="Email"
        id="email"
        type="email"
        value={getValue("email")}
        onChange={() => {}}
        name="email"
        autoComplete="email"
        disabled={true}
      />
      <InputField
        label="User ID"
        id="id"
        type="text"
        value={userId ?? ""}
        onChange={() => {}}
        name="id"
        autoComplete="off"
        disabled={true}
      />
    </>
  );
};

export default ProfileFields;
