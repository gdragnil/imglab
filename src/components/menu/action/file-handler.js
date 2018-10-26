import nimnImageStore from "./nimn-format-imagestore";
import nimnAppConfig from "./nimn-format-appconfig";
import nimnLabelData from "./nimn-format-labeldata";

function getStoreData(store) {
  let dataImageStore = store.getters["image-store/getStoreData"];
  let dataAppConfig = store.getters["app-config/getStoreData"];
  let dataLabelData = store.getters["label-data/getStoreData"];

  return {
    "image-store": dataImageStore,
    "app-config": dataAppConfig,
    "label-data": dataLabelData
  };
}

export function encodeAsNimn(store) {
  var nimn = require("nimnjs");

  let storeData = getStoreData(store);

  let nimnStore = {
    type: "map",
    detail: [nimnImageStore, nimnAppConfig, nimnLabelData]
  };

  let schemaStore = nimn.buildSchema(nimnStore);
  let stringStore = nimn.stringify(schemaStore, storeData);

  return stringStore;
}

export function encodeAsDlibXML(store) {
  let dlib_header = `
  <?xml version='1.0' encoding='ISO-8859-1'?>
  <?xml-stylesheet type='text/xsl' href='image_metadata_stylesheet.xsl'?>
  <dataset>
    <name>dlib face detection dataset generated by ImgLab</name>

    <comment>
      This dataset is manually crafted or adjusted using ImgLab web annotation tool
      For more details, please go to https://github.com/NaturalIntelligence/imglab
    </comment>

    <images>
  `;

  let storeData = getStoreData(store);

  let xml = "";
  let { images, shapes, featurePoints } = storeData["image-store"];

  Object.values(images).forEach(image => {
    xml += `
      <image file='${image.name}'>
    `;

    image.shapes.forEach(shapeID => {
      let shape = shapes[shapeID];
      let box = shape.rbox;
      xml += `
        <box top='${box.y}' left='${box.x}' width='${box.w}' height='${box.h}'>
          <label>${shapes[shapeID].label || shapes[shapeID].type}</label>`;

      shape.featurePoints.forEach(featurePointID => {
        let fp = featurePoints[featurePointID];
        xml += `
          <part name='${fp.id}' x='${Math.floor(fp.x)}' y='${Math.floor(fp.y)}'/>`;
      });
      xml += `
        </box>
      `;
    });

    xml += `
      </image>
    `;
  });

  let dlib_footer = `
    </images>
  </dataset>`;

  return dlib_header + xml + dlib_footer;
}

export function encodeAsDlibPts(store, shapeID) {
  let storeData = getStoreData(store);
  let shapes = storeData["image-store"].shapes;
  let shape = shapes[shapeID];
  var data = `
version: 1
n_points: ${shape.featurePoints.length}
{
`;

  let featurePoints = storeData["image-store"].featurePoints;
  shape.featurePoints.forEach(featurePointID => {
    let featurePoint = featurePoints[featurePointID];
    data += `${Math.floor(featurePoint.x)} ${Math.floor(featurePoint.y)}\n`;
  });

  data += "}";

  return data;
}
