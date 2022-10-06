import * as pako from "https://esm.sh/pako";

export function createTGSFile(src: string | object) {
  const tgsKit = new TGSKit();
  tgsKit.load(src);
  const errors = tgsKit.validate();

  if (errors.length > 0) {
    return { file: undefined, errors };
  }

  return { file: tgsKit.generate(), errors: undefined };
}

interface IValidationError {
  message: string;
  details?: IValidationError[];
}

// THIS CODE IS COPIED FROM https://github.com/LottieFiles/tgskit/blob/master/src/TGSKit.ts
class TGSKit {
  private _data: any = {};

  public load(src: string | object) {
    // Check if src is a string
    if (typeof src === "string") {
      // Attempt to parse the src string into JSON
      const json = this.parseJSON(src);
      if (json !== false) {
        src = json;
      }
    }

    // Check if src is not an object
    if (typeof src === "object") {
      return (this._data = src);
    }

    throw new Error("Given resource could not be loaded or is invalid.");
  }

  /**
   * Parse a resource into a JSON object
   */
  public parseJSON(src: string): object | false {
    try {
      return JSON.parse(src);
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate a TGS file and return contents.
   */
  public generate() {
    // Add TGS attribute
    this._data.tgs = 1;

    // Remove markers, fonts and chars
    delete this._data.markers;
    delete this._data.fonts;
    delete this._data.chars;

    // GZip
    const gzByteArray = pako.gzip(JSON.stringify(this._data));

    // // Create gzip blob
    const blob = new Blob([gzByteArray], { type: "application/gzip" });

    return blob;
  }

  /**
   * Validates that the Bodymovin JSON meets the requirements for
   * a Telegram Sticker (tgs).
   */
  public validate(): IValidationError[] {
    const errors: IValidationError[] = [];

    if (this._data.fr != 30 && this._data.fr != 60) {
      errors.push({ message: "Frame rate must be exactly 30 or 60" });
    }

    if ((this._data.op - this._data.ip) / this._data.fr > 3.0) {
      errors.push({ message: "Should not be longer than 3 seconds" });
    }

    if (this._data.w != 512 || this._data.h != 512) {
      errors.push({ message: "Dimensions should be exactly 512px x 512px" });
    }

    if (this._data.ddd != null && this._data.ddd != 0) {
      errors.push({ message: "Should not have 3D layers" });
    }

    if ("markers" in this._data) {
      // TODO: Is this check necessary?
      // errors.push('Must not have markers');
    }

    if ("assets" in this._data && Array.isArray(this._data.assets)) {
      const assetsErrors: IValidationError[] = [];

      this._data.assets.forEach((asset: any, i: number) => {
        if ("layers" in asset && Array.isArray(asset.layers)) {
          const assetErrors: IValidationError[] = this.checkLayer(asset.layers);

          if (assetErrors.length !== 0) {
            assetsErrors.push({
              message: `Asset ${asset.id} has errors`,
              details: assetErrors,
            });
          }
        }
      });

      if (assetsErrors.length !== 0) {
        errors.push({
          message: "Assets must not have errors",
          details: assetsErrors,
        });
      }
    }

    if ("layers" in this._data && Array.isArray(this._data.layers)) {
      const layersErrors: IValidationError[] = [];

      this._data.layers.forEach((layer: any) => {
        const layerErrors: IValidationError[] = this.checkLayer(layer);

        if (layerErrors.length !== 0) {
          layersErrors.push({
            message: `Layer "${layer.nm}"`,
            details: layerErrors,
          });
        }
      });

      if (layersErrors.length !== 0) {
        errors.push({ message: "Layers have errors", details: layersErrors });
      }
    } else {
      errors.push({ message: "Should have atleast 1 layer" });
    }

    if (
      "fonts" in this._data &&
      Array.isArray(this._data.fonts) &&
      this._data.fonts.length > 0
    ) {
      errors.push({ message: "Should not have fonts" });
    }

    if (
      "chars" in this._data &&
      Array.isArray(this._data.chars) &&
      this._data.chars.length > 0
    ) {
      errors.push({ message: "Should not have glyph chars" });
    }

    if (this.generate().size > 65536) {
      errors.push({ message: "Total sticker size should not exceed 64 KB" });
    }

    return errors;
  }

  private checkLayer(layer: any): IValidationError[] {
    const errors: IValidationError[] = [];

    if (layer.ddd != null && layer.ddd != 0) {
      errors.push({ message: "Composition should not include any 3D Layers" });
    }

    if (layer.sr != null && layer.sr != 1) {
      errors.push({
        message: "Composition should not include any Time Stretching",
      });
    }

    if (layer.tm != null) {
      errors.push({
        message: "Composition should not include any Time Remapping",
      });
    }

    if (layer.ty === 1) {
      errors.push({ message: "Composition should not include any Solids" });
    }

    if (layer.ty === 2) {
      errors.push({ message: "Composition should not include any Images" });
    }

    if (layer.ty === 5) {
      errors.push({ message: "Composition should not include any Texts" });
    }

    if (layer.hasMask === true || layer.masksProperties != null) {
      errors.push({ message: "Composition should not include any Masks" });
    }

    if (layer.tt != null) {
      errors.push({ message: "Composition should not include any Mattes" });
    }

    if (layer.ao === 1) {
      errors.push({
        message: "Composition should not include any Auto-Oriented Layers",
      });
    }

    if (layer.ef != null) {
      errors.push({
        message: "Composition should not include any Layer Effects",
      });
    }

    if ("shapes" in layer && Array.isArray(layer.shapes)) {
      const shapesErrors: IValidationError[] = this.checkItems(
        layer.shapes,
        true
      );

      if (shapesErrors.length !== 0) {
        errors.push({
          message: "Composition shapes should not have errors",
          details: shapesErrors,
        });
      }
    }

    return errors;
  }

  private checkItems(items: any, shapes: any): IValidationError[] {
    const errors: IValidationError[] = [];

    if (items != null) {
      items.forEach((item: any) => {
        if (item.ty == "rp") {
          errors.push({
            message: "Composition should not include any Repeaters",
          });
        }

        if (item.ty == "sr") {
          errors.push({
            message: "Composition should not include any Star Shapes",
          });
        }

        if (item.ty == "mm") {
          errors.push({
            message: "Composition should not include any Merge Paths",
          });
        }

        if (item.ty == "gs") {
          errors.push({
            message: "Composition should not include any Gradient Strokes",
          });
        }

        if (shapes === true) {
          const itemErrors: IValidationError[] = this.checkItems(
            item.it,
            false
          );

          if (itemErrors.length !== 0) {
            errors.push({
              message: "Composition items should not have errors",
              details: itemErrors,
            });
          }
        }
      });
    }

    return errors;
  }
}
