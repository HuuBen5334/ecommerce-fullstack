package com.example.ecommerce_backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;
import pricing.PricingServiceGrpc;

import java.lang.reflect.Field;
import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private OrderNotificationService orderNotificationService;

    @MockitoBean
    @SuppressWarnings("unused")
    private PricingServiceGrpc.PricingServiceBlockingStub pricingStub;

    @Test
    void notifyOrderUpdate_messageDeliveredToSubscriber() throws Exception {
        BlockingQueue<OrderUpdateMessage> received = new LinkedBlockingDeque<>();

        WebSocketStompClient stompClient = new WebSocketStompClient(
                new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient())))
        );
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());

        StompSession session = stompClient
                .connect("http://localhost:" + port + "/ws", new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

        session.subscribe("/topic/orders/user/1", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return OrderUpdateMessage.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                received.add((OrderUpdateMessage) payload);
            }
        });

        Thread.sleep(200); // let the subscription register before publishing

        User user = new User("Alice", "alice@example.com");
        Field userIdField = User.class.getDeclaredField("id");
        userIdField.setAccessible(true);
        userIdField.set(user, 1L);

        ProductOrder order = new ProductOrder();
        Field orderIdField = ProductOrder.class.getDeclaredField("id");
        orderIdField.setAccessible(true);
        orderIdField.set(order, 42L);
        order.setStatus(OrderStatus.PENDING);
        order.setPriceAtPurchase(new BigDecimal("49.99"));
        order.setUser(user);

        orderNotificationService.notifyOrderUpdate(order);

        OrderUpdateMessage msg = received.poll(5, TimeUnit.SECONDS);
        assertNotNull(msg, "No WebSocket message received within timeout");
        assertEquals(42L, msg.orderId());
        assertEquals(1L, msg.userId());
        assertEquals("PENDING", msg.status());
        assertEquals(new BigDecimal("49.99"), msg.priceAtPurchase());

        session.disconnect();
    }
}