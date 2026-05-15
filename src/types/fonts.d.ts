/**
 * Describes a font resource to be loaded for the PDF generation.
 */
type FontResource = {
  /**
   * The full URL to the TTF font file.
   */
  src: string;
  /**
   * The font family name.
   *
   * @example "Nunito"
   */
  family: string;
  /**
   * The font style.
   *
   * @example "normal"
   */
  style: string;
  /**
   * The font weight.
   *
   * @example 400
   */
  fontWeight: number;
};