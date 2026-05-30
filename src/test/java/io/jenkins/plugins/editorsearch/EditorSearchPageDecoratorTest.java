package io.jenkins.plugins.editorsearch;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import hudson.model.PageDecorator;
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
}
