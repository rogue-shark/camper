function ShowHideAdmin(adminCheck) {
  let adminPass = document.getElementById('admin-pass');
  adminPass.style.display = adminCheck.checked ? 'block' : 'none';
}
