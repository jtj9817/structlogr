export interface SampleLog {
    id: string;
    name: string;
    description: string;
    content: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export const sampleLogs: SampleLog[] = [
    {
        id: 'apache-access',
        name: 'Apache Access Log',
        description: 'Standard Apache web server access log entry',
        difficulty: 'easy',
        content: `127.0.0.1 - - [15/Oct/2025:14:32:01 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`,
    },
    {
        id: 'nginx-error',
        name: 'Nginx Error Log',
        description: 'Nginx web server error log entry',
        difficulty: 'easy',
        content: `2025/10/15 14:32:01 [error] 12345#12345: *67890 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.100, server: example.com, request: "GET /api/data HTTP/1.1", upstream: "http://127.0.0.1:8080/api/data", host: "example.com"`,
    },
    {
        id: 'application-error',
        name: 'Application Error Log',
        description: 'Generic application error with stack trace',
        difficulty: 'medium',
        content: `2025-10-15 14:32:01 ERROR [main] com.example.app.UserService - Failed to connect to database
java.sql.SQLException: Connection refused: connect
	at com.example.app.Database.connect(Database.java:123)
	at com.example.app.UserService.getUser(UserService.java:45)
	at com.example.app.Main.main(Main.java:12)
Caused by: java.net.ConnectException: Connection refused: connect
	... 3 more`,
    },
    {
        id: 'docker-logs',
        name: 'Docker Container Log',
        description: 'Docker container application log',
        difficulty: 'medium',
        content: `2025-10-15T14:32:01.123Z INFO  [web-server] Server started on port 8080
2025-10-15T14:32:02.456Z DEBUG [web-server] Processing request from 192.168.1.100
2025-10-15T14:32:03.789Z WARN  [web-server] Slow query detected: 2.5s
2025-10-15T14:32:04.012Z ERROR [web-server] Database connection failed: timeout after 30s`,
    },
    {
        id: 'kubernetes-pod',
        name: 'Kubernetes Pod Log',
        description: 'Kubernetes pod application logs',
        difficulty: 'hard',
        content: `2025-10-15T14:32:01.123456Z stdout F {"timestamp":"2025-10-15T14:32:01.123Z","level":"INFO","message":"Application started","service":"user-api","pod":"user-api-7c8b9d6f-abc123","namespace":"production"}
2025-10-15T14:32:02.456789Z stdout F {"timestamp":"2025-10-15T14:32:02.456Z","level":"DEBUG","message":"Processing user request","service":"user-api","user_id":12345,"endpoint":"/api/users/12345"}
2025-10-15T14:32:03.987654Z stderr F {"timestamp":"2025-10-15T14:32:03.987Z","level":"ERROR","message":"Database connection failed","service":"user-api","error":"Connection timeout","retry_count":3}`,
    },
    {
        id: 'syslog',
        name: 'System Log (syslog)',
        description: 'Linux system log entry',
        difficulty: 'easy',
        content: `Oct 15 14:32:01 server1 sshd[12345]: Accepted password for user1 from 192.168.1.100 port 54321 ssh2
Oct 15 14:32:02 server1 systemd[1]: Started Daily apt download activities.
Oct 15 14:32:03 server1 kernel: [123456.789012] usb 1-1: new high-speed USB device number 2 using xhci_hcd`,
    },
    {
        id: 'json-logs',
        name: 'Structured JSON Log',
        description: 'Application log in JSON format',
        difficulty: 'easy',
        content: `{"timestamp":"2025-10-15T14:32:01.123Z","level":"INFO","message":"User login successful","user_id":12345,"ip_address":"192.168.1.100","user_agent":"Mozilla/5.0"}
{"timestamp":"2025-10-15T14:32:02.456Z","level":"WARN","message":"Slow database query","query_time":2.5,"query":"SELECT * FROM users WHERE id = ?"}
{"timestamp":"2025-10-15T14:32:03.789Z","level":"ERROR","message":"Payment processing failed","order_id":"ORD-12345","error_code":"PAYMENT_DECLINED","amount":99.99}`,
    },
];
