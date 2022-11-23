module.exports = {
    script: "src/scripts/main.js",
    // Specify which folder to watch
    watch: true,
    // Specify delay between watch interval
    watch_delay: 1000,
    // Specify which folder to ignore
    ignore_watch: ["node_modules", "MultiDatabase.db"],
    exp_backoff_restart_delay: 100,
    out_file: "/dev/null",
    error_file: "/dev/null",
};
