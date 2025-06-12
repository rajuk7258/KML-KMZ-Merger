
let files = [];

function clearFiles() {
  files = [];
  updateFileList();
  document.getElementById("output").innerText = "Files cleared.";
}

document.getElementById("fileInput").addEventListener("change", (e) => {
  files.push(...Array.from(e.target.files));
  updateFileList();
});

function updateFileList() {
  const list = document.getElementById("fileList");
  list.innerHTML = "";
  files.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "bg-gray-200 px-3 py-2 rounded flex justify-between items-center";
    li.innerHTML = `
      ${file.name}
      <button onclick="removeFile(${index})" class="text-red-600 font-bold">🗑️</button>
    `;
    list.appendChild(li);
  });
}

function removeFile(index) {
  files.splice(index, 1);
  updateFileList();
}

async function mergeFiles() {
  if (files.length === 0) {
    document.getElementById("output").innerText = "No files selected.";
    return;
  }

  document.getElementById("output").innerText = "Merging files...";
  let mergedPlacemarks = [];

  for (const file of files) {
    if (file.name.endsWith(".kmz")) {
      const zip = await JSZip.loadAsync(file);
      const kmlFile = zip.file(/.kml$/i)[0];
      if (kmlFile) {
        const kmlText = await kmlFile.async("string");
        const placemarks = extractPlacemarks(kmlText);
        mergedPlacemarks.push(...placemarks);
      }
    } else if (file.name.endsWith(".kml")) {
      const text = await file.text();
      const placemarks = extractPlacemarks(text);
      mergedPlacemarks.push(...placemarks);
    }
  }

  const finalKML = buildFinalKML(mergedPlacemarks);
  const blob = new Blob([finalKML], { type: "application/vnd.google-earth.kml+xml" });
  const url = URL.createObjectURL(blob);
  document.getElementById("output").innerHTML = `<a href="${url}" download="merged.kml" class="text-green-600 font-semibold underline">Download merged.kml</a>`;
}

function extractPlacemarks(kmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlString, "text/xml");
  const placemarks = xmlDoc.querySelectorAll("Placemark, Folder, Document");
  return Array.from(placemarks).map(el => el.outerHTML);
}

function buildFinalKML(placemarks) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Merged File</name>
    ${placemarks.join("\n")}
  </Document>
</kml>`;
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('Service Worker Registered');
  });
}
