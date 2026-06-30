// vite.config.js
import { defineConfig } from "file:///Users/apple/frappe-15-test/apps/crm/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/apple/frappe-15-test/apps/crm/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/apple/frappe-15-test/apps/crm/frontend/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import path from "path";
import { VitePWA } from "file:///Users/apple/frappe-15-test/apps/crm/frontend/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/Users/apple/frappe-15-test/apps/crm/frontend";
var vite_config_default = defineConfig(async ({ mode }) => {
  const isDev = mode === "development";
  const config = {
    plugins: [
      vue(),
      vueJsx(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        devOptions: {
          enabled: true
        },
        manifest: {
          display: "standalone",
          name: "Frappe CRM",
          short_name: "Frappe CRM",
          start_url: "/crm",
          description: "Modern & 100% Open-source CRM tool to supercharge your sales operations",
          icons: [
            {
              src: "/assets/crm/manifest/manifest-icon-192.maskable.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/assets/crm/manifest/manifest-icon-192.maskable.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: "/assets/crm/manifest/manifest-icon-512.maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/assets/crm/manifest/manifest-icon-512.maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    optimizeDeps: {
      include: [
        "feather-icons",
        "tailwind.config.js",
        "prosemirror-state",
        "prosemirror-view",
        "lowlight",
        "interactjs"
      ]
    },
    server: {
      fs: {
        allow: [path.resolve(__vite_injected_original_dirname, "..")]
      }
    }
  };
  const frappeui = await importFrappeUIPlugin(isDev, config);
  config.plugins.unshift(
    frappeui({
      frappeProxy: true,
      lucideIcons: true,
      jinjaBootData: true,
      buildConfig: {
        indexHtmlPath: "../crm/www/crm.html",
        emptyOutDir: true,
        sourcemap: true
      }
    })
  );
  return config;
});
async function importFrappeUIPlugin(isDev, config) {
  if (isDev) {
    try {
      const fs = await import("node:fs");
      const localVitePluginPath = path.resolve(__vite_injected_original_dirname, "../frappe-ui/vite");
      if (fs.existsSync(localVitePluginPath)) {
        const module2 = await import("../frappe-ui/vite");
        console.info("Local frappe-ui vite plugin found, using local plugin");
        config.resolve.alias = getAliases(config);
        return module2.default;
      } else {
        console.warn("Local frappe-ui vite plugin not found, using npm package");
      }
    } catch (error) {
      console.warn(
        "Local frappe-ui not found, falling back to npm package:",
        error.message
      );
    }
  }
  const module = await import("file:///Users/apple/frappe-15-test/apps/crm/frontend/node_modules/frappe-ui/vite/index.js");
  return module.default;
}
function getAliases(config) {
  return {
    ...config.resolve.alias,
    "frappe-ui/tailwind": path.resolve(
      __vite_injected_original_dirname,
      "../frappe-ui/tailwind/preset.js"
    ),
    "frappe-ui/style.css": path.resolve(
      __vite_injected_original_dirname,
      "../frappe-ui/src/style.css"
    ),
    "frappe-ui/frappe": path.resolve(__vite_injected_original_dirname, "../frappe-ui/frappe/index.js"),
    "frappe-ui": path.resolve(__vite_injected_original_dirname, "../frappe-ui/src/index.ts")
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYXBwbGUvZnJhcHBlLTE1LXRlc3QvYXBwcy9jcm0vZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hcHBsZS9mcmFwcGUtMTUtdGVzdC9hcHBzL2NybS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYXBwbGUvZnJhcHBlLTE1LXRlc3QvYXBwcy9jcm0vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhhc3luYyAoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgaXNEZXYgPSBtb2RlID09PSAnZGV2ZWxvcG1lbnQnXG4gIGNvbnN0IGNvbmZpZyA9IHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICB2dWUoKSxcbiAgICAgIHZ1ZUpzeCgpLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgICB3b3JrYm94OiB7XG4gICAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDUgKiAxMDI0ICogMTAyNCxcbiAgICAgICAgfSxcbiAgICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICAgIG5hbWU6ICdGcmFwcGUgQ1JNJyxcbiAgICAgICAgICBzaG9ydF9uYW1lOiAnRnJhcHBlIENSTScsXG4gICAgICAgICAgc3RhcnRfdXJsOiAnL2NybScsXG4gICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAnTW9kZXJuICYgMTAwJSBPcGVuLXNvdXJjZSBDUk0gdG9vbCB0byBzdXBlcmNoYXJnZSB5b3VyIHNhbGVzIG9wZXJhdGlvbnMnLFxuICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogJy9hc3NldHMvY3JtL21hbmlmZXN0L21hbmlmZXN0LWljb24tMTkyLm1hc2thYmxlLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICBwdXJwb3NlOiAnYW55JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNyYzogJy9hc3NldHMvY3JtL21hbmlmZXN0L21hbmlmZXN0LWljb24tMTkyLm1hc2thYmxlLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICBwdXJwb3NlOiAnbWFza2FibGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnL2Fzc2V0cy9jcm0vbWFuaWZlc3QvbWFuaWZlc3QtaWNvbi01MTIubWFza2FibGUucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnL2Fzc2V0cy9jcm0vbWFuaWZlc3QvbWFuaWZlc3QtaWNvbi01MTIubWFza2FibGUucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgIHB1cnBvc2U6ICdtYXNrYWJsZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAnZmVhdGhlci1pY29ucycsXG4gICAgICAgICd0YWlsd2luZC5jb25maWcuanMnLFxuICAgICAgICAncHJvc2VtaXJyb3Itc3RhdGUnLFxuICAgICAgICAncHJvc2VtaXJyb3ItdmlldycsXG4gICAgICAgICdsb3dsaWdodCcsXG4gICAgICAgICdpbnRlcmFjdGpzJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGZzOiB7XG4gICAgICAgIGFsbG93OiBbcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJyldLFxuICAgICAgfSxcbiAgICB9LFxuICB9XG5cbiAgY29uc3QgZnJhcHBldWkgPSBhd2FpdCBpbXBvcnRGcmFwcGVVSVBsdWdpbihpc0RldiwgY29uZmlnKVxuICBjb25maWcucGx1Z2lucy51bnNoaWZ0KFxuICAgIGZyYXBwZXVpKHtcbiAgICAgIGZyYXBwZVByb3h5OiB0cnVlLFxuICAgICAgbHVjaWRlSWNvbnM6IHRydWUsXG4gICAgICBqaW5qYUJvb3REYXRhOiB0cnVlLFxuICAgICAgYnVpbGRDb25maWc6IHtcbiAgICAgICAgaW5kZXhIdG1sUGF0aDogJy4uL2NybS93d3cvY3JtLmh0bWwnLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgKVxuXG4gIHJldHVybiBjb25maWdcbn0pXG5cbmFzeW5jIGZ1bmN0aW9uIGltcG9ydEZyYXBwZVVJUGx1Z2luKGlzRGV2LCBjb25maWcpIHtcbiAgaWYgKGlzRGV2KSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGlmIGxvY2FsIGZyYXBwZS11aSBoYXMgdGhlIHZpdGUgcGx1Z2luIGZpbGVcbiAgICAgIGNvbnN0IGZzID0gYXdhaXQgaW1wb3J0KCdub2RlOmZzJylcbiAgICAgIGNvbnN0IGxvY2FsVml0ZVBsdWdpblBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vZnJhcHBlLXVpL3ZpdGUnKVxuXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhsb2NhbFZpdGVQbHVnaW5QYXRoKSkge1xuICAgICAgICBjb25zdCBtb2R1bGUgPSBhd2FpdCBpbXBvcnQoJy4uL2ZyYXBwZS11aS92aXRlJylcbiAgICAgICAgY29uc29sZS5pbmZvKCdMb2NhbCBmcmFwcGUtdWkgdml0ZSBwbHVnaW4gZm91bmQsIHVzaW5nIGxvY2FsIHBsdWdpbicpXG4gICAgICAgIGNvbmZpZy5yZXNvbHZlLmFsaWFzID0gZ2V0QWxpYXNlcyhjb25maWcpXG4gICAgICAgIHJldHVybiBtb2R1bGUuZGVmYXVsdFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMb2NhbCBmcmFwcGUtdWkgdml0ZSBwbHVnaW4gbm90IGZvdW5kLCB1c2luZyBucG0gcGFja2FnZScpXG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgJ0xvY2FsIGZyYXBwZS11aSBub3QgZm91bmQsIGZhbGxpbmcgYmFjayB0byBucG0gcGFja2FnZTonLFxuICAgICAgICBlcnJvci5tZXNzYWdlLFxuICAgICAgKVxuICAgIH1cbiAgfVxuICAvLyBGYWxsIGJhY2sgdG8gbnBtIHBhY2thZ2UgaWYgbG9jYWwgaW1wb3J0IGZhaWxzXG4gIGNvbnN0IG1vZHVsZSA9IGF3YWl0IGltcG9ydCgnZnJhcHBlLXVpL3ZpdGUnKVxuICByZXR1cm4gbW9kdWxlLmRlZmF1bHRcbn1cblxuZnVuY3Rpb24gZ2V0QWxpYXNlcyhjb25maWcpIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5jb25maWcucmVzb2x2ZS5hbGlhcyxcbiAgICAnZnJhcHBlLXVpL3RhaWx3aW5kJzogcGF0aC5yZXNvbHZlKFxuICAgICAgX19kaXJuYW1lLFxuICAgICAgJy4uL2ZyYXBwZS11aS90YWlsd2luZC9wcmVzZXQuanMnLFxuICAgICksXG4gICAgJ2ZyYXBwZS11aS9zdHlsZS5jc3MnOiBwYXRoLnJlc29sdmUoXG4gICAgICBfX2Rpcm5hbWUsXG4gICAgICAnLi4vZnJhcHBlLXVpL3NyYy9zdHlsZS5jc3MnLFxuICAgICksXG4gICAgJ2ZyYXBwZS11aS9mcmFwcGUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vZnJhcHBlLXVpL2ZyYXBwZS9pbmRleC5qcycpLFxuICAgICdmcmFwcGUtdWknOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vZnJhcHBlLXVpL3NyYy9pbmRleC50cycpLFxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlULFNBQVMsb0JBQW9CO0FBQ3RWLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsZUFBZTtBQUp4QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWEsT0FBTyxFQUFFLEtBQUssTUFBTTtBQUM5QyxRQUFNLFFBQVEsU0FBUztBQUN2QixRQUFNLFNBQVM7QUFBQSxJQUNiLFNBQVM7QUFB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
