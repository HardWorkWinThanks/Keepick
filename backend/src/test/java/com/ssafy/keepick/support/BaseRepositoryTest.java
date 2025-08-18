package com.ssafy.keepick.support;

import com.ssafy.keepick.global.config.QueryDslConfig;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

@Import({QueryDslConfig.class})
@DataJpaTest
public abstract class BaseRepositoryTest extends BaseTest {
}
