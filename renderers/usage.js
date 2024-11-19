async function initializeUsageDashboard() {
  try {
      await window.electronAPI.refreshTokens(); 
      const data = await window.electronAPI.getTrueNASStatus();  
      if (data) {
          updateDashboard(data);
          updateLastUpdated();
      }

    // getDriveInfo should connect to our backend. 
      const driveInfo = await window.electronAPI.getDriveInfo('jnpj');
      if (driveInfo) {
          updateDriveInfo(driveInfo);
      }
      
      setInterval(async () => {
          try {
              const newData = await window.electronAPI.getTrueNASStatus();
              if (newData) {
                  updateDashboard(newData);
                  updateLastUpdated();
              }

              const newDriveInfo = await window.electronAPI.getDriveInfo('jnpj');
              if (newDriveInfo) {
                  updateDriveInfo(newDriveInfo);
              }
          } catch (err) {
              showError(err.message);
          }
      }, 30000);

  } catch (error) {
      showError(error.message);
  }
}

function updateDashboard(data) {
  const storageInfo = document.getElementById('storage-info');
  if (data.storage && data.storage.length > 0) {
      const poolsHtml = data.storage.map(pool => `
          <div class="pool-status ${pool.healthy ? 'healthy' : 'warning'}">
              <div class="status-header">
                  <span class="pool-name">${pool.name}</span>
                  <span class="status-badge">${pool.status}</span>
              </div>
              <div class="usage-bar">
                  <div class="progress" style="width: ${(pool.used / pool.total * 100).toFixed(1)}%"></div>
              </div>
              <div class="pool-details">
                  <div>Used: ${formatBytes(pool.used)} of ${formatBytes(pool.total)}</div>
                  <div>Available: ${formatBytes(pool.available)}</div>
                  <div>Status: ${pool.healthy ? 'Healthy' : 'Warning'}</div>
              </div>
          </div>
      `).join('');
      
      storageInfo.innerHTML = poolsHtml;
  } else {
      storageInfo.innerHTML = '<div class="no-data">No storage pools available</div>';
  }

  const diskInfo = document.getElementById('disk-info');
  if (data.disks && data.disks.length > 0) {
      const disksHtml = data.disks.map(disk => `
          <div class="disk-status">
              <div class="disk-header">
                  <span class="disk-name">${disk.name}</span>
                  <span class="status-badge">${disk.status}</span>
              </div>
              <div class="disk-details">
                  <div>Model: ${disk.model}</div>
                  <div>Size: ${formatBytes(disk.size)}</div>
                  <div>Temperature: ${disk.temperature}°C</div>
                  <div>Type: ${disk.type}</div>
                  <div>Serial: ${disk.serial}</div>
              </div>
          </div>
      `).join('');
      
      diskInfo.innerHTML = disksHtml;
  } else {
      diskInfo.innerHTML = '<div class="no-data">No disk information available</div>';
  }
}

function updateDriveInfo(driveInfo) {
  const driveInfoContainer = document.getElementById('drive-info-container');
  if (driveInfo) {
      const driveHtml = `
          <div class="drive-status">
              <div class="drive-header">
                  <span class="drive-name">${driveInfo.name || 'JNPJ Drive'}</span>
                  <span class="status-badge">${driveInfo.status || 'ONLINE'}</span>
              </div>
              <div class="drive-details">
                  <div>Type: ${driveInfo.type}</div>
                  <div>Used: ${formatBytes(driveInfo.used?.parsed || 0)}</div>
                  <div>Available: ${formatBytes(driveInfo.available?.parsed || 0)}</div>
                  <div>Compression: ${driveInfo.compression || 'None'}</div>
                  <div>Mount Point: ${driveInfo.mountpoint || 'Not mounted'}</div>
              </div>
          </div>
      `;
      
      driveInfoContainer.innerHTML = driveHtml;
  } else {
      driveInfoContainer.innerHTML = '<div class="no-data">No drive information available</div>';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function updateLastUpdated() {
  const now = new Date();
  const element = document.getElementById('last-update');
  if (element) {
      element.textContent = now.toLocaleString();
  }
}

function showError(message) {
  const storageInfo = document.getElementById('storage-info');
  if (storageInfo) {
      storageInfo.innerHTML = `
          <div class="error-message">
              Error loading storage data: ${message}
          </div>
      `;
  }
}

document.addEventListener('DOMContentLoaded', initializeUsageDashboard);