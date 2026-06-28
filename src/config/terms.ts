import { AgreementTermsSchema } from "@/schemas/form";

/**
 * The static terms for the rental receipt.
 */
export const RECEIPT_TERMS: string = `By signing this Rental Receipt, RENTEE acknowledges that the vehicle identified above was returned on the date and time shown, that the odometer reading, fuel level, and other return information listed herein accurately reflect the vehicle at the time of return, and that the rental period under the Rental Agreement ended upon return of the vehicle. RENTEE further acknowledges receipt of this Rental Receipt and the charges stated herein, subject to any additional amounts that may become due under the Rental Agreement.`;

/**
 * A static definition of the rental agreement terms and conditions.
 *
 * @note In the future, support customization of these terms.
 */
export const AGREEMENT_TERMS: AgreementTermsSchema = {
  version: 1,
  effective_date: new Date("2026-06-09T17:22:21.803Z"),
  conditions: [
    {
      title: "DRIVERS",
      description:
        "In no event shall the Vehicle be used, operated or driven by any person other than the Rentee or qualified licensed drivers at least 21 years of age who have the Rentor's advance permission to use the Vehicle and whose names appear on Page 1 hereof.",
      sub_conditions: [],
    },
    {
      title: "PROHIBITED USE",
      description: "The Vehicle shall not be used:",
      list_format: "numerical",
      sub_conditions: [
        "for the transportation of persons for compensation;",
        "in any race, test, or competitive event;",
        "outside the United States without first obtaining Rentor's written permission;",
        "by any person not specified in Paragraph 1 above;",
        "in violation of any federal, state, or local laws;",
        "while under the influence of intoxicants or drugs;",
        "to push or tow any vehicle except a trailer properly attached to the 5th wheel of a tractor, or a single axle 2-wheel lightweight trailer if the Vehicle is equipped with a towing hitch installed for or by the Rentor but not to be a bumper snap-on hitch. In no event shall passengers be carried in or on a trailer.",
        "to leave the keys in, or fail to properly lock up or secure the Vehicle (excluding valet parking);",
        "if further use of the Vehicle would cause damage (e.g. warning light on, flat tire, or steam rising from engine);",
        "to carry hazardous or explosive substances;",
        "to transport a total Vehicle and payload weight in excess of the gross Vehicle weight as specified on the Vehicle but the Vehicle payload weight shall not exceed that which is specified on Page 1 hereof;",
        "to drive in or through a structure where there is insufficient clearance, whether of height or width, or off regularly maintained roadways;",
        "to drive the Vehicle if cargo is improperly and/or not secured. IN NO EVENT SHALL RENTEE SUBRENT OR RELEASE THE VEHICLE TO ANOTHER PERSON OR CORPORATION. If the Vehicle is obtained from Rentor by fraud or misrepresentation or is obtained or used in furtherance of an illegal purpose, all use of the Vehicle is WITHOUT RENTOR'S PERMISSION. The foregoing conditions are cumulative and each of them shall apply to every use, operation or driving of the Vehicle.",
      ],
    },
    {
      title: "RETURN OF VEHICLE",
      description:
        "This Agreement is one of rental only. The Vehicle is property of the Rentor and shall be returned to the Rentor's address or at a place designated by the Rentor and on the date shown on Page 1, or earlier if demanded, together with all tires, tools, accessories, and equipment in the same condition as when received, ordinary wear and tear expected. Failure to return the Vehicle to the place and on the date set forth in this Agreement will terminate Rentor's permission for the Rentee to use the Vehicle and thus will terminate the extension of all insurance coverage herein provided. If the rented Vehicle is returned to the Rentor at any place other than listed herein, Rentee agrees to pay all expenses incurred by Rentor to have the Vehicle returned. Rentor or any of its agents or employees may peacefully repossess the Vehicle without demand wherever found and terminate this Rental Agreement if the Vehicle is illegally parked, is used in violation of the law, or in violation of this Agreement, or was abandoned. Rentor shall not be liable to Rentee for damages resulting from such repossession nor responsible for loss or damage to any property of Rentee contained therein.",
      sub_conditions: [],
    },
    {
      title: "AMOUNTS DUE RENTOR",
      description: "Rentee shall pay Rentor on demand:",
      list_format: "alphabetical",
      sub_conditions: [
        "All time and mileage charges as computed on Page 1 of this Agreement, with mileage determined by reading the Vehicle odometer or hubodometer. Rentee shall NOT detach the odometer or hubodometer and shall pay for repair or replacement if any seal has been broken, along with a mileage charge adjustment based on Rentor's experience;",
        "basic or minimum rate, service, Vehicle Damage Waiver (VDW), and other charges shown on Page 1 hereof;",
        "refueling charge if the Vehicle is returned with less fuel than when rented and, as indicated on Page 1 hereof, the rate does not include fuel;",
        "all states, use, excise, or other tax charges on Page 1 hereof, by Rentor as reimbursement for taxes paid. Rentee is responsible for fuel, weight, and road use permits;",
        "all fines, penalties, forfeitures, court costs, and out-of-pocket expenses incurred by Rentor with respect to Rentee's use of the Vehicle, including parking, traffic, or other violations assessed against Rentor, the Vehicle, or Rentee, unless due to Rentor's fault;",
        "Rentor's costs and expenses, including reasonable attorney's fees (unless prohibited by law), incurred in collecting any payments due hereunder or in repossessing the Vehicle;",
        "Rentor's costs and expenses resulting from loss or damage to the Vehicle while on rental, whether or not due to Rentee's fault, except if Rentee has otherwise complied with the terms and provisions of this Agreement. Rentee's liability for loss or damage to the Vehicle by fire, theft, collision, upset, or other causes insured under the Comprehensive and Collision or Upset Coverage of an automobile physical damage insurance policy is limited to a MAXIMUM of the amount written on Page 1 of this Agreement or is waived by Rentor on Page 1 of this Agreement at time of rental. NOTE: Vehicle Damage Waiver does not cover loss or damage to the Vehicle resulting from violation of Paragraph 1. DRIVERS or Paragraph 2. PROHIBITED USE of this Agreement, for missing Vehicle parts, or interior Vehicle damage other than normal wear and tear caused by Vehicle occupants including animals.",
      ],
    },
    {
      title: "VEHICLE INSURANCE",
      description:
        "Rentor provides liability coverage for persons using the Vehicle with the permission of the Rentor, as provided for in Paragraph 1 thereof (and not otherwise), in accordance with an automobile liability insurance policy with limits equal to the minimum requirements of applicable state financial responsibility law or similar law or statute. All coverages afforded under this Agreement are applicable only after all other valid and collectible insurance (whether primary, excess, or contingent) has been paid and exhausted to the full limits of all such policies. Unless required by law, the policy does not include No-Fault, Supplemental No-Fault, Uninsured/Under Insured Motorists Coverage, or other optional coverages, and Rentee hereby rejects such coverage to the extent permitted by law. Where such coverages are required by law, they are provided at the minimum required limits. RENTOR'S POLICY SHALL NOT PAY: (1) to any obligation for which the Rentee, any driver of the Vehicle, or the employer of either, or any insurance carrier may be held liable under any Worker's Compensation, disability benefits, or similar law; (2) to any obligation assumed by Rentee or driver under any express or implied contract; (3) to any liability of Rentee, any driver, or employer of either arising while the Vehicle is being used in violation of the terms and provisions of this Agreement; (4) unless otherwise required by law, to medical payments required by persons sustaining injuries while riding, alighting from, or getting into or on the Vehicle.",
      sub_conditions: [],
    },
    {
      title: "INDEMNITY",
      description:
        "Rentee releases and holds Rentor, its agents and employees, harmless from all claims for loss or damage to any property of Rentee or any other person left in, on, or about the Vehicle, either before or after its return to Rentor or on Rentor's premises, without regard to any negligence by Rentor or its agents or employees. Rentee shall defend, indemnify, and hold harmless Rentor from and against any and all losses, liabilities, damages, injuries, claims, demands, costs, and expenses arising out of use or possession of the Vehicle, including but not limited to any and all fines, penalties, and forfeitures imposed under any Federal, State, Municipal, or other statute, law, ordinance, rule, regulation, or insurance policy provision, and to the extent not covered by insurance, any claims of or liabilities to third persons arising out of abandonment, conversion, secretion, concealment, or unauthorized sale of the Vehicle by Rentee or its drivers, agents or employees, or confiscation of the Vehicle by governmental authority for illegal or improper use of the Vehicle. Additionally, Rentee shall indemnify and hold Rentor harmless for all loss, liability, and expense in excess of the liability limits provided for herein as a result of bodily injury, death, or property damage arising out of use or operation of the Vehicle.",
      sub_conditions: [],
    },
    {
      title: "NO AGENCY",
      description:
        "Neither Rentee nor any other driver of the Vehicle shall be or is deemed to be the agent, servant, or employee of Rentor for any reason or purpose. During the term of this Agreement, Rentee shall completely assume full responsibility for the Vehicle to the public and any regulatory body having jurisdiction.",
      sub_conditions: [],
    },
    {
      title: "REPAIRS",
      description:
        "Rentee shall not permit any repairs to the Vehicle or suffer any lien to be placed upon it without Rentor's consent. Rentee shall be liable for any such repairs.",
      sub_conditions: [],
    },
    {
      title: "ACCIDENTS",
      description:
        "Rentee shall immediately report any accident to Rentor and deliver to Rentor or its insurer every process, pleading, notice, or paper of any kind received by Rentee or any driver of the Vehicle relating to any claim, suit, or proceeding connected with any accident or event involving the Vehicle. Neither Rentee nor any driver of the Vehicle shall aid or abet the assertion of any such claim, suit, or proceeding and shall cooperate fully with Rentor and its insurer in investigating and defending the same.",
      sub_conditions: [],
    },
    {
      title: "CREDIT CHARGES",
      description:
        "In the event Rentee directs Rentor to bill charges hereunder to any other person, or organization, such person or organization and Rentee shall be jointly and severally liable for all such charges. RENTEE EXPRESSLY AUTHORIZES RENTOR TO PROCESS A CREDIT CARD VOUCHER, IF ANY, IN HIS NAME FOR CHARGES MADE HEREUNDER.",
      sub_conditions: [],
    },
  ],
};
