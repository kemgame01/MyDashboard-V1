.
├── README.md
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── assets/
│   │   └── README.md
│   ├── components/
│   │   ├── BrandManager.jsx
│   │   ├── CategoryBrandManager.jsx
│   │   ├── CategoryManager.jsx
│   │   ├── CustomerDebug.jsx
│   │   ├── Dashboard.js
│   │   ├── EnhancedShopSelector.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── ErrorPopup.jsx
│   │   ├── InputField.js
│   │   ├── Layout.js
│   │   ├── Modal.js
│   │   ├── PrivateRoute.js
│   │   ├── SalesCombobox.jsx
│   │   ├── SearchForm.js
│   │   ├── ShopManager.jsx
│   │   ├── SignupForm.js
│   │   ├── Spinner.jsx
│   │   ├── StyledDatePicker.jsx
│   │   ├── TaskManagementSection.jsx
│   │   └── TaskSummarySection.jsx
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── README.md
│   ├── features/
│   │   ├── customers/
│   │   │   ├── BulkActionBar.js
│   │   │   ├── CustomerControlsDisclosure.js
│   │   │   ├── CustomerDeleteModal.js
│   │   │   ├── CustomerDisclosureRow.jsx
│   │   │   ├── CustomerEditModal.js
│   │   │   ├── CustomerFilters.jsx
│   │   │   ├── CustomerForm.js
│   │   │   ├── CustomerInfo.js
│   │   │   ├── CustomerList.js
│   │   │   ├── CustomerRow.jsx
│   │   │   ├── CustomerSection.jsx
│   │   │   ├── CustomerTableRow.js
│   │   │   ├── Pagination.js
│   │   │   ├── QuickAddDisclosureRow.jsx
│   │   │   ├── QuickAddRow.js
│   │   │   └── TagChangeConfirmModal.jsx
│   │   ├── inventory/
│   │   │   ├── InventoryDashboard.jsx
│   │   │   ├── InventoryForm.jsx
│   │   │   ├── InventoryHistory.jsx
│   │   │   ├── InventoryHistoryFilterBar.jsx
│   │   │   ├── InventorySummary.jsx
│   │   │   ├── InventoryTable.jsx
│   │   │   └── ProductLog.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SidebarLogoutButton.jsx
│   │   │   ├── SidebarNavItem.jsx
│   │   │   └── SidebarUserInfo.jsx
│   │   ├── sales/
│   │   │   ├── ProductItemFields.jsx
│   │   │   ├── RecentSalesSection.jsx
│   │   │   ├── SaleModal.jsx
│   │   │   ├── SaleProductTable.jsx
│   │   │   ├── SalesDashboard.jsx
│   │   │   ├── SalesLineGraph.jsx
│   │   │   ├── SummaryCard.jsx
│   │   │   ├── component/
│   │   │   ├── index.js
│   │   │   └── salesChartHelpers.js
│   │   ├── shops/
│   │   │   ├── PendingInvitations.jsx
│   │   │   ├── ShopAnalytics.jsx
│   │   │   ├── ShopAssignmentModal.jsx
│   │   │   ├── ShopForm.jsx
│   │   │   ├── ShopInvitationModal.jsx
│   │   │   ├── ShopManagementComponents.jsx
│   │   │   ├── ShopManager.jsx
│   │   │   └── UserShopAssignments.jsx
│   │   ├── userprofile/
│   │   │   ├── AdminFields.js
│   │   │   ├── ProfileFields.js
│   │   │   ├── UserProfile.jsx
│   │   │   ├── profileService.js
│   │   │   └── useUserProfile.js
│   │   └── users/
│   │       ├── AuditLog.jsx
│   │       ├── PermissionMatrixEditor.jsx
│   │       ├── RoleManagementSection.jsx
│   │       ├── SendPasswordResetButton.jsx
│   │       ├── UserBlockDialog.jsx
│   │       ├── UserDeleteDialog.jsx
│   │       ├── UserForm.jsx
│   │       ├── UserInviteDialog.jsx
│   │       ├── UserResetPasswordDialog.jsx
│   │       ├── UserRoleDialog.jsx
│   │       ├── UserTable.jsx
│   │       ├── auditLogService.js
│   │       └── inviteService.js
│   ├── hooks/
│   │   ├── README.md
│   │   ├── useAuth.js
│   │   ├── useCategoryBrandManager.js
│   │   ├── useCustomers.js
│   │   ├── useInventory.js
│   │   ├── useMergedUser.js
│   │   ├── useProducts.js
│   │   ├── useSales.js
│   │   └── useShopManager.js
│   ├── index.css
│   ├── index.js
│   ├── lib/
│   │   ├── salesUtils.js
│   │   └── validationUtils.js
│   ├── logo.svg
│   ├── pages/
│   │   ├── AdminMigration.jsx
│   │   ├── AuditLogPage.jsx
│   │   ├── CustomerSearch.js
│   │   ├── Login.js
│   │   ├── NotFound.js
│   │   └── Signup.js
│   ├── reportWebVitals.js
│   ├── scripts/
│   │   └── runMigration.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── logInventoryHistory.js
│   │   ├── permissionService.js
│   │   ├── salesService.js
│   │   └── shopInvitationService.js
│   ├── setupTests.js
│   ├── styles/
│   │   ├── CustomerSection.css
│   │   ├── Login.css
│   │   ├── Spinner.css
│   │   ├── animations.css
│   │   ├── datepicker-modern.css
│   │   ├── header-styles.css
│   │   └── sidebar-profile-enhancement.css
│   └── utils/
│       ├── README.md
│       ├── exportCSV.js
│       ├── firestoreMigration.js
│       ├── formatDate.js
│       ├── importExportUtils.js
│       ├── migrateCustomersToShops.js
│       ├── permissions.js
│       ├── roles.js
│       ├── shopMigration.js
│       └── shopPermissions.js
└── tailwind.config.js
