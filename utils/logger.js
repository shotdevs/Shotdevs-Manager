const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
};

class Logger {
    static info(message) {
        console.log(`${getTimestamp()} │ ℹ️  │ ${message}`);
    }

    static success(message) {
        console.log(`${getTimestamp()} │ ✅ │ ${message}`);
    }

    static warning(message) {
        console.log(`${getTimestamp()} │ ⚠️  │ ${message}`);
    }

    static error(message) {
        console.log(`${getTimestamp()} │ ❌ │ ${message}`);
    }

    static license(message, isError = false) {
        console.log(`${getTimestamp()} │ 🔑 │ ${isError ? '❌ ' : ''}${message}`);
    }

    static command(message) {
        console.log(`${getTimestamp()} │ 🛠️  │ ${message}`);
    }

    static database(message) {
        console.log(`${getTimestamp()} │ 🗄️  │ ${message}`);
    }

    static web(message) {
        console.log(`${getTimestamp()} │ 🌐 │ ${message}`);
    }

    static bot(message) {
        console.log(`${getTimestamp()} │ 🤖 │ ${message}`);
    }
}

module.exports = Logger;