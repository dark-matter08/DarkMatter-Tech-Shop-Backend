const Busboy = require("busboy");

// ===== firebase imports ======
const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage, ref } = require("firebase-admin/storage");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

var serviceAccount = require("../dmtechsop-firebase-adminsdk-c64aq-b4090c4639.json");

const bucket_name = "dmtechsop";

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: bucket_name,
});

const fire_storage = getStorage(app);
const bucket = fire_storage.bucket(bucket_name);

async function parseMultimediaForm(req, folder) {
  const busboy = Busboy({ headers: req.headers });
  // This object will accumulate all the uploaded files, keyed by their name
  let parsed_fields = {};
  let uploads = [];
  let signed_urls = [];
  let result = {};

  // =================================== On File ===========================================

  busboy.on("file", async (fieldname, file, filename, encoding, mimetype) => {
    const fileName = fieldname.replace(" ", "-");
    const uniqueSuffix = Date.now();
    const extention = FILE_TYPE_MAP[filename.mimeType];
    const new_fieldname = `${fileName}-${uniqueSuffix}.${extention}`;
    const new_firebase_file = bucket.file(`${folder}/${new_fieldname}`);

    uploads.push({
      file,
      new_fieldname,
      new_firebase_file,
    });

    signed_urls.push(
      `https://firebasestorage.googleapis.com/v0/b/${bucket_name}/o/${folder}%2F${new_fieldname}?alt=media`
    );

    file.pipe(
      new_firebase_file.createWriteStream({
        resumable: false,
        validation: false,
        metadata: {
          contentType: filename.mimeType,
        },
      })
    );
  });

  // =================================== On Field ===========================================
  busboy.on("field", (name, val, info) => {
    console.log(`Field [${name}]: value: %j`, val);
    parsed_fields[name] = val;
  });

  // =================================== On finish ===========================================
  busboy.on("finish", async () => {
    console.log("Finishing bussboy");
  });

  // =================================== On Close ===========================================

  busboy.on("close", () => {
    console.log("Done parsing form!");
  });

  req.pipe(busboy);
  busboy.end(req.rawBody);

  console.log(uploads);

  if (result.error) {
    return result;
  }
  parsed_fields["signed_urls"] = signed_urls;
  return parsed_fields;
}

module.exports = parseMultimediaForm;
