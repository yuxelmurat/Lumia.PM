import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { assetPinSchema } from "../schemas";
import createGuest from "./controllers/create-guest";
import createGuestPin from "./controllers/create-guest-pin";
import createGuestPinNote from "./controllers/create-guest-pin-note";
import { fetchPinsByAssetId } from "./controllers/pin-queries";
import { resolveShareLink } from "./controllers/resolve-share-link";

// Fully unauthenticated routes for external clients holding a share-link
// token. Must be mounted before the global auth middleware in index.ts so
// requests never hit `authenticateApiRequest`, matching the existing
// `/public-project/:id` pattern. Token possession is the sole
// authorization check here.
const publicAssetPin = new Hono()
  .get(
    "/:token",
    describeRoute({
      operationId: "getPublicAsset",
      tags: ["Public Asset Pins"],
      description:
        "Resolve a share-link token to its asset and existing pin annotations, for unauthenticated client review",
      security: [],
      responses: {
        200: {
          description: "Asset metadata and existing pins",
          content: { "application/json": { schema: resolver(v.any()) } },
        },
      },
    }),
    validator("param", v.object({ token: v.string() })),
    async (c) => {
      const { token } = c.req.valid("param");
      const link = await resolveShareLink(token);
      const pins = await fetchPinsByAssetId(link.assetId);
      const apiBaseUrl = process.env.KANEO_API_URL || "http://localhost:1337";
      return c.json({
        asset: {
          id: link.assetId,
          filename: link.filename,
          mimeType: link.mimeType,
          kind: link.kind,
          url: `${apiBaseUrl}/api/asset/${link.assetId}?shareToken=${token}`,
        },
        pins,
      });
    },
  )
  .post(
    "/:token/guest",
    describeRoute({
      operationId: "createPublicAssetGuest",
      tags: ["Public Asset Pins"],
      description:
        "Register a lightweight guest identity (name + email, no account) scoped to this share link",
      security: [],
      responses: {
        200: {
          description: "Guest identity created",
          content: {
            "application/json": {
              schema: resolver(v.object({ guestId: v.string() })),
            },
          },
        },
      },
    }),
    validator("param", v.object({ token: v.string() })),
    validator(
      "json",
      v.object({
        name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
        email: v.pipe(v.string(), v.email(), v.maxLength(255)),
      }),
    ),
    async (c) => {
      const { token } = c.req.valid("param");
      const { name, email } = c.req.valid("json");
      const link = await resolveShareLink(token);
      const guest = await createGuest(link.shareLinkId, name, email);
      return c.json({ guestId: guest?.id });
    },
  )
  .post(
    "/:token/pins",
    describeRoute({
      operationId: "createPublicAssetPin",
      tags: ["Public Asset Pins"],
      description: "Create a pin annotation as a share-link guest",
      security: [],
      responses: {
        200: {
          description: "Pin created successfully",
          content: { "application/json": { schema: resolver(assetPinSchema) } },
        },
      },
    }),
    validator("param", v.object({ token: v.string() })),
    validator(
      "json",
      v.object({
        guestId: v.string(),
        content: v.pipe(v.string(), v.minLength(1)),
        x: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
        y: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
        viewerState: v.optional(v.any()),
        label: v.optional(v.pipe(v.string(), v.maxLength(80))),
      }),
    ),
    async (c) => {
      const { token } = c.req.valid("param");
      const { guestId, ...input } = c.req.valid("json");
      const link = await resolveShareLink(token);
      const pin = await createGuestPin(
        link.assetId,
        link.shareLinkId,
        guestId,
        input,
      );
      return c.json(pin);
    },
  )
  .post(
    "/:token/pins/:pinId/notes",
    describeRoute({
      operationId: "createPublicAssetPinNote",
      tags: ["Public Asset Pins"],
      description: "Reply to a pin's note thread as a share-link guest",
      security: [],
      responses: {
        200: {
          description: "Note created successfully",
          content: { "application/json": { schema: resolver(assetPinSchema) } },
        },
      },
    }),
    validator("param", v.object({ token: v.string(), pinId: v.string() })),
    validator(
      "json",
      v.object({
        guestId: v.string(),
        content: v.pipe(v.string(), v.minLength(1)),
      }),
    ),
    async (c) => {
      const { token, pinId } = c.req.valid("param");
      const { guestId, content } = c.req.valid("json");
      const link = await resolveShareLink(token);
      const pin = await createGuestPinNote(
        link.assetId,
        pinId,
        link.shareLinkId,
        guestId,
        content,
      );
      return c.json(pin);
    },
  );

export default publicAssetPin;
