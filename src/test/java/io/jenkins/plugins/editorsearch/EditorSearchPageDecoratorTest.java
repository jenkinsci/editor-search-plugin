package io.jenkins.plugins.editorsearch;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import hudson.model.PageDecorator;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.htmlunit.html.HtmlPage;
import org.junit.jupiter.api.Test;
import org.jvnet.hudson.test.JenkinsRule;
import org.jvnet.hudson.test.junit.jupiter.WithJenkins;

@WithJenkins
class EditorSearchPageDecoratorTest {

    @Test
    void registersPageDecorator(JenkinsRule jenkins) {
        assertNotNull(PageDecorator.all().get(EditorSearchPageDecorator.class));
    }

    @Test
    void injectsEditorSearchAdjunct(JenkinsRule jenkins) throws Exception {
        HtmlPage page = jenkins.createWebClient().goTo("");
        String html = page.getWebResponse().getContentAsString();
        assertTrue(html.contains("editor-search.css"), html);
        assertTrue(html.contains("editor-search.js"), html);
    }

    @Test
    void detectsCurrentCodeMirrorScrollbarClass() throws IOException {
        try (InputStream source = getClass().getResourceAsStream("/io/jenkins/plugins/editorsearch/editor-search.js")) {
            assertNotNull(source);
            assertTrue(new String(source.readAllBytes(), StandardCharsets.UTF_8).contains(".CodeMirror-scrollbar"));
        }
    }

    @Test
    void keepsNarrowSearchPanelsClearOfScrollbarOffset() throws IOException {
        try (InputStream source =
                getClass().getResourceAsStream("/io/jenkins/plugins/editorsearch/editor-search.css")) {
            assertNotNull(source);
            assertTrue(new String(source.readAllBytes(), StandardCharsets.UTF_8)
                    .contains("right: var(--editor-search-control-right, 6px);"));
        }
    }
}
